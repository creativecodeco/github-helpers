import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'node:path';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { getUserStats, getUserLanguages, getFeaturedRepo, getUserStreak } from './github';
import { renderStatsCard } from './renderer/statsCard';
import { renderLanguagesCard } from './renderer/languagesCard';
import { renderRepoCard } from './renderer/repoCard';
import { renderRankCard } from './renderer/rankCard';
import { renderStreakCard } from './renderer/streakCard';
import { recordHit, getMetrics, getAllUserMetrics } from './metrics';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy configuration for correct rate limit IP tracking behind reverse proxies
const trustProxy = process.env.TRUST_PROXY || '1';
if (trustProxy === 'true') {
  app.set('trust proxy', true);
} else if (trustProxy === 'false') {
  app.set('trust proxy', false);
} else if (!Number.isNaN(Number(trustProxy))) {
  app.set('trust proxy', Number(trustProxy));
} else {
  app.set('trust proxy', trustProxy);
}

// Helmet security headers (configured for card embedding support)
// CSP fetch directives are enabled with a strict policy.
// SVG cards are served as image/svg+xml and embedded via <img> tags, so they
// are sandboxed by the browser regardless of CSP — no script or fetch
// directives are needed for the cards themselves.
// The policy below protects the HTML index page served by express.static.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://static.cloudflareinsights.com",
          "https://www.googletagmanager.com"
        ], // allow local script, Cloudflare, and Google Analytics
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"], // inline styles and Google Fonts
        imgSrc: ["'self'", "data:", "https://www.google-analytics.com", "https://analytics.google.com"], // allow Google Analytics tracking pixels
        fontSrc: ["'self'", "https://fonts.gstatic.com"], // local and Google Fonts
        connectSrc: [
          "'self'",
          "https://www.google-analytics.com",
          "https://analytics.google.com"
        ], // allow client-side fetch/XHR to own endpoints and Google Analytics
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'none'"]
      }
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow embedding on external sites (like GitHub)
    crossOriginEmbedderPolicy: false
  })
);

// CORS: public card endpoints must be embeddable from any origin (GitHub READMEs, etc.).
// Metrics endpoints are intentionally excluded — they require a server-side API key
// and should never be called cross-origin from a browser.
const publicCardsCors = cors({
  origin: '*', // SVG cards are public read-only resources
  methods: ['GET'], // only GET is needed; no mutations
  allowedHeaders: [], // no custom request headers required
  exposedHeaders: ['Cache-Control', 'Content-Type'],
  credentials: false // credentials (cookies/auth) are never used with wildcard origin
});

app.use('/api/stats', publicCardsCors);
app.use('/api/languages', publicCardsCors);
app.use('/api/repo', publicCardsCors);
app.use('/api/rank', publicCardsCors);
app.use('/api/streak', publicCardsCors);
// /api/metrics routes intentionally have no CORS middleware — browser cross-origin
// requests are blocked by default (same-origin policy), which is the desired behaviour.

app.use(express.json());

// Input validation regex matching official GitHub username rules
const GITHUB_USERNAME_REGEX = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const GITHUB_REPO_REGEX = /^[a-z\d-_.]{1,100}$/i;

// Rate limiting to prevent abuse, DoS, and GitHub API token exhaustion
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    if (req.path.startsWith('/api/metrics')) {
      res.status(429).json({ error: 'Límite de peticiones excedido. Intenta más tarde.' });
    } else {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(429).send(renderErrorCard('Límite de peticiones excedido (Rate Limit)'));
    }
  }
});

// Apply rate limiter to all API endpoints
app.use('/api/', apiLimiter);

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, '../public')));

// Helper to render an SVG error card
function renderErrorCard(message: string): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="495" height="195" viewBox="0 0 495 195">
      <rect width="495" height="195" rx="12" fill="#0d1117" stroke="#f85149" stroke-width="2" />
      <g transform="translate(25, 45)">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#f85149" transform="scale(1.5)"/>
        <text x="45" y="18" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="bold" font-size="18" fill="#f85149">Error en GitHub Helpers</text>
        <text x="45" y="42" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="14" fill="#c9d1d9">${message}</text>
        <text x="0" y="95" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11" fill="#8b949e">Verifica el nombre de usuario o intenta más tarde.</text>
      </g>
      <text x="470" y="25" text-anchor="end" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="600" font-size="9px" fill="#8b949e" opacity="0.6">
        CreativeCode.com.co
      </text>
    </svg>
  `.trim();
}

function extractThemeOverrides(query: Record<string, any>): Record<string, string> {
  const overrides: Record<string, string> = {};
  const keys = ['bg', 'text', 'title', 'accent', 'secondary', 'border', 'bgGradient'];
  for (const key of keys) {
    const value = query[key];
    if (typeof value === 'string') {
      overrides[key] = value;
    }
  }
  return overrides;
}

// ─── Health Check ──────────────────────────────────────────────────────────
// Registered BEFORE the rate limiter so it is never throttled.
// Used by Docker HEALTHCHECK, Coolify, Traefik and Caddy liveness probes.
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route for General Stats Card SVG
app.get('/api/stats', async (req: Request, res: Response) => {
  const { username, theme } = req.query;

  if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(400).send(renderErrorCard('Usuario de GitHub inválido'));
  }

  try {
    const stats = await getUserStats(username);
    const overrides = extractThemeOverrides(req.query);
    const svg = await renderStatsCard(stats, theme as string, overrides);

    res.setHeader('Content-Type', 'image/svg+xml');
    // Cache for 2 hours in browser/GitHub Camo
    res.setHeader('Cache-Control', 'public, max-age=7200');
    recordHit('stats', {
      username: username as string,
      userAgent: req.headers['user-agent'],
      referer: req.headers['referer'],
      ip: req.ip
    });
    return res.status(200).send(svg);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error(`Error in /api/stats for ${username}:`, error);
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(500).send(renderErrorCard(message || 'Error al obtener datos'));
  }
});

// Route for Languages Card SVG
app.get('/api/languages', async (req: Request, res: Response) => {
  const { username, theme } = req.query;

  if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(400).send(renderErrorCard('Usuario de GitHub inválido'));
  }

  try {
    const languages = await getUserLanguages(username);
    const overrides = extractThemeOverrides(req.query);
    const svg = renderLanguagesCard(languages, theme as string, overrides, username);

    res.setHeader('Content-Type', 'image/svg+xml');
    // Cache for 2 hours in browser/GitHub Camo
    res.setHeader('Cache-Control', 'public, max-age=7200');
    recordHit('languages', {
      username: username as string,
      userAgent: req.headers['user-agent'],
      referer: req.headers['referer'],
      ip: req.ip
    });
    return res.status(200).send(svg);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error(`Error in /api/languages for ${username}:`, error);
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(500).send(renderErrorCard(message || 'Error al obtener datos'));
  }
});

// Route for Featured Repo Card SVG
app.get('/api/repo', async (req: Request, res: Response) => {
  const { username, repo, theme } = req.query;

  if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(400).send(renderErrorCard('Usuario de GitHub inválido'));
  }

  if (repo && (typeof repo !== 'string' || !GITHUB_REPO_REGEX.test(repo))) {
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(400).send(renderErrorCard('Repositorio de GitHub inválido'));
  }

  try {
    const repoStats = await getFeaturedRepo(username, (repo as string) || undefined);
    const overrides = extractThemeOverrides(req.query);
    const svg = renderRepoCard(repoStats, theme as string, overrides);

    res.setHeader('Content-Type', 'image/svg+xml');
    // Cache for 2 hours in browser/GitHub Camo
    res.setHeader('Cache-Control', 'public, max-age=7200');
    recordHit('repo', {
      username: username as string,
      userAgent: req.headers['user-agent'],
      referer: req.headers['referer'],
      ip: req.ip
    });
    return res.status(200).send(svg);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error(`Error in /api/repo for ${username}/${repo || 'featured'}:`, error);
    res.setHeader('Content-Type', 'image/svg+xml');
    return res
      .status(500)
      .send(renderErrorCard(message || 'Error al obtener datos del repositorio'));
  }
});

// Route for Developer Rank Card SVG
app.get('/api/rank', async (req: Request, res: Response) => {
  const { username, theme } = req.query;

  if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(400).send(renderErrorCard('Usuario de GitHub inválido'));
  }

  try {
    const stats = await getUserStats(username);
    const overrides = extractThemeOverrides(req.query);
    const svg = renderRankCard(stats, theme as string, overrides);

    res.setHeader('Content-Type', 'image/svg+xml');
    // Cache for 2 hours in browser/GitHub Camo
    res.setHeader('Cache-Control', 'public, max-age=7200');
    recordHit('rank', {
      username: username as string,
      userAgent: req.headers['user-agent'],
      referer: req.headers['referer'],
      ip: req.ip
    });
    return res.status(200).send(svg);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error(`Error in /api/rank for ${username}:`, error);
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(500).send(renderErrorCard(message || 'Error al obtener datos'));
  }
});

// Route for Streak Stats Card SVG
app.get('/api/streak', async (req: Request, res: Response) => {
  const { username, theme } = req.query;

  if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(400).send(renderErrorCard('Usuario de GitHub inválido'));
  }

  try {
    const streak = await getUserStreak(username);
    const overrides = extractThemeOverrides(req.query);
    const svg = renderStreakCard(streak, theme as string, overrides);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=7200');
    recordHit('streak', {
      username,
      userAgent: req.headers['user-agent'],
      referer: req.headers['referer'],
      ip: req.ip
    });
    return res.status(200).send(svg);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error(`Error in /api/streak for ${username}:`, error);
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(500).send(renderErrorCard(message || 'Error al obtener datos'));
  }
});

// Middleware to authenticate metrics requests with API key
function checkMetricsKey(req: Request, res: Response, next: () => void) {
  const expectedKey = process.env.METRICS_KEY;
  if (!expectedKey) {
    return res
      .status(403)
      .json({ error: 'Las métricas no están configuradas o el acceso está deshabilitado.' });
  }

  const providedKey =
    req.query.key ||
    req.headers['x-api-key'] ||
    (req.headers['authorization']?.startsWith('Bearer ')
      ? req.headers['authorization'].slice(7)
      : undefined);

  if (providedKey !== expectedKey) {
    return res
      .status(401)
      .json({ error: 'Acceso no autorizado. Se requiere una clave de métrica válida.' });
  }

  next();
}

// Route to get persisted metrics
app.get('/api/metrics', checkMetricsKey, (_req: Request, res: Response) => {
  return res.status(200).json(getMetrics());
});

// Route to get detailed user metrics
app.get('/api/metrics/users', checkMetricsKey, async (_req: Request, res: Response) => {
  try {
    const userMetrics = await getAllUserMetrics();
    return res.status(200).json(userMetrics);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({ error: message });
  }
});

// Catch-all route to serve the frontend (index.html)
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
