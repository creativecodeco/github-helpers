import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { getUserStats, getUserLanguages, getFeaturedRepo } from './github';
import { renderStatsCard } from './renderer/statsCard';
import { renderLanguagesCard } from './renderer/languagesCard';
import { renderRepoCard } from './renderer/repoCard';
import { renderRankCard } from './renderer/rankCard';
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
} else if (!isNaN(Number(trustProxy))) {
  app.set('trust proxy', Number(trustProxy));
} else {
  app.set('trust proxy', trustProxy);
}

// Helmet security headers (configured for card embedding support)
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP to allow SVG inline styles/fonts
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow embedding on external sites (like GitHub)
    crossOriginEmbedderPolicy: false
  })
);

app.use(cors());
app.use(express.json());

// Input validation regex matching official GitHub username rules
const GITHUB_USERNAME_REGEX = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const GITHUB_REPO_REGEX = /^[a-z\d-_.]{1,100}$/i;

// Rate limiting to prevent Abuse, DoS, and GitHub API token exhaustion
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

// Helper to extract custom styling overrides from URL query params
function extractThemeOverrides(query: any): Record<string, string> {
  const overrides: Record<string, string> = {};
  const keys = ['bg', 'text', 'title', 'accent', 'secondary', 'border', 'bgGradient'];
  for (const key of keys) {
    if (query[key] && typeof query[key] === 'string') {
      overrides[key] = query[key];
    }
  }
  return overrides;
}

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
  } catch (error: any) {
    console.error(`Error in /api/stats for ${username}:`, error);
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(500).send(renderErrorCard(error.message || 'Error al obtener datos'));
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
  } catch (error: any) {
    console.error(`Error in /api/languages for ${username}:`, error);
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(500).send(renderErrorCard(error.message || 'Error al obtener datos'));
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
  } catch (error: any) {
    console.error(`Error in /api/repo for ${username}/${repo || 'featured'}:`, error);
    res.setHeader('Content-Type', 'image/svg+xml');
    return res
      .status(500)
      .send(renderErrorCard(error.message || 'Error al obtener datos del repositorio'));
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
  } catch (error: any) {
    console.error(`Error in /api/rank for ${username}:`, error);
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(500).send(renderErrorCard(error.message || 'Error al obtener datos'));
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
      .json({ error: 'Acceso no autorizado. Se requiere una clave de metrica valida.' });
  }

  next();
}

// Route to get persisted metrics
app.get('/api/metrics', checkMetricsKey, (req: Request, res: Response) => {
  return res.status(200).json(getMetrics());
});

// Route to get detailed user metrics
app.get('/api/metrics/users', checkMetricsKey, async (req: Request, res: Response) => {
  try {
    const userMetrics = await getAllUserMetrics();
    return res.status(200).json(userMetrics);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Catch-all route to serve the frontend (index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
