import 'reflect-metadata';
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

// Infrastructure
import { initDatabase } from '@/infrastructure/database/database';

// Repositories
import { ApiGitHubRepository } from '@/adapters/repositories/ApiGitHubRepository';
import { CachedGitHubRepository } from '@/adapters/repositories/CachedGitHubRepository';
import { TypeORMTokenRepository } from '@/adapters/repositories/TypeORMTokenRepository';
import { TypeORMMetricsRepository } from '@/adapters/repositories/TypeORMMetricsRepository';

// Use Cases
import { GetUserStatsCardUseCase } from '@/use-cases/cards/GetUserStatsCardUseCase';
import { GetUserLanguagesCardUseCase } from '@/use-cases/cards/GetUserLanguagesCardUseCase';
import { GetFeaturedRepoCardUseCase } from '@/use-cases/cards/GetFeaturedRepoCardUseCase';
import { GetUserRankCardUseCase } from '@/use-cases/cards/GetUserRankCardUseCase';
import { GetUserStreakCardUseCase } from '@/use-cases/cards/GetUserStreakCardUseCase';
import { GetUserTrophiesCardUseCase } from '@/use-cases/cards/GetUserTrophiesCardUseCase';
import { GetUserTopReposCardUseCase } from '@/use-cases/cards/GetUserTopReposCardUseCase';
import { RegisterUserTokenUseCase } from '@/use-cases/tokens/RegisterUserTokenUseCase';
import { RevokeUserTokenUseCase } from '@/use-cases/tokens/RevokeUserTokenUseCase';
import { PurgeUserDataUseCase } from '@/use-cases/users/PurgeUserDataUseCase';
import { RecordProfileViewUseCase } from '@/use-cases/metrics/RecordProfileViewUseCase';

// Controllers
import { CardController } from '@/adapters/controllers/CardController';
import { TokenController } from '@/adapters/controllers/TokenController';
import { MetricsController } from '@/adapters/controllers/MetricsController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Wire up dependencies
const rawGithubRepo = new ApiGitHubRepository();
const githubRepo = new CachedGitHubRepository(rawGithubRepo);
const tokenRepo = new TypeORMTokenRepository();
const metricsRepo = new TypeORMMetricsRepository();

const statsCardUseCase = new GetUserStatsCardUseCase(githubRepo, tokenRepo, metricsRepo);
const languagesCardUseCase = new GetUserLanguagesCardUseCase(githubRepo, tokenRepo, metricsRepo);
const repoCardUseCase = new GetFeaturedRepoCardUseCase(githubRepo, tokenRepo, metricsRepo);
const rankCardUseCase = new GetUserRankCardUseCase(githubRepo, tokenRepo, metricsRepo);
const streakCardUseCase = new GetUserStreakCardUseCase(githubRepo, metricsRepo);
const trophiesCardUseCase = new GetUserTrophiesCardUseCase(githubRepo, tokenRepo, metricsRepo);
const topReposCardUseCase = new GetUserTopReposCardUseCase(githubRepo);

const registerTokenUseCase = new RegisterUserTokenUseCase(tokenRepo, githubRepo);
const revokeTokenUseCase = new RevokeUserTokenUseCase(tokenRepo, githubRepo);
const purgeUserDataUseCase = new PurgeUserDataUseCase();
const recordProfileViewUseCase = new RecordProfileViewUseCase(metricsRepo);

const cardController = new CardController(
  statsCardUseCase,
  languagesCardUseCase,
  repoCardUseCase,
  rankCardUseCase,
  streakCardUseCase,
  trophiesCardUseCase,
  recordProfileViewUseCase,
  topReposCardUseCase
);

const tokenController = new TokenController(
  registerTokenUseCase,
  revokeTokenUseCase,
  purgeUserDataUseCase
);
const metricsController = new MetricsController(metricsRepo);

// Trust proxy configuration
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

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://static.cloudflareinsights.com',
          'https://www.googletagmanager.com',
          'https://cdn.jsdelivr.net'
        ],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: [
          "'self'",
          'data:',
          'https://www.google-analytics.com',
          'https://analytics.google.com',
          'https://www.googletagmanager.com'
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: [
          "'self'",
          'https://www.google-analytics.com',
          'https://analytics.google.com',
          'https://stats.g.doubleclick.net'
        ],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'none'"]
      }
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false
  })
);

const publicCardsCors = cors({
  origin: '*',
  methods: ['GET'],
  allowedHeaders: [],
  exposedHeaders: ['Cache-Control', 'Content-Type'],
  credentials: false
});

app.use('/api/stats', publicCardsCors);
app.use('/api/languages', publicCardsCors);
app.use('/api/repo', publicCardsCors);
app.use('/api/rank', publicCardsCors);
app.use('/api/streak', publicCardsCors);
app.use('/api/trophies', publicCardsCors);
app.use('/api/top-repos', publicCardsCors);

app.use(express.json());

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

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    if (req.path.startsWith('/api/metrics')) {
      res.status(429).json({ error: 'Límite de peticiones excedido. Intenta más tarde.' });
    } else {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(429).send(renderErrorCard('Límite de peticiones excedido (Rate Limit)'));
    }
  }
});

app.use('/api/', apiLimiter);

app.get('/', (req: Request, res: Response) => {
  const userParam = req.query.user || req.query.username;
  const { theme } = req.query;
  const indexPath = path.join(__dirname, '../../../../public/index.html');

  if (!fs.existsSync(indexPath)) {
    res.status(404).send('index.html not found. Please build the frontend first.');
    return;
  }

  let html = fs.readFileSync(indexPath, 'utf-8');

  // Dynamic preview URLs
  const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const host = req.get('host') || 'github-helpers.creativecode.com.co';
  const baseUrl = `${protocol}://${host}`;

  let targetUsername = 'creativecode';
  let targetTheme = 'radical';

  if (typeof userParam === 'string' && /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(userParam)) {
    targetUsername = userParam;
  }
  if (typeof theme === 'string' && /^[a-z\d_]{1,50}$/i.test(theme)) {
    targetTheme = theme;
  }

  const imageUrl = `${baseUrl}/api/stats?username=${targetUsername}&theme=${targetTheme}`;
  const title = `Tarjetas de estadísticas para @${targetUsername} | GitHub Helpers`;
  const description = `Mira las estadísticas, lenguajes más usados y trofeos de GitHub para @${targetUsername} generados dinámicamente.`;

  // Dynamically replace SEO / OpenGraph tags
  html = html
    .replace(
      /<meta property="og:image" content="[^"]*"\/?>/gi,
      `<meta property="og:image" content="${imageUrl}" />`
    )
    .replace(
      /<meta property="twitter:image" content="[^"]*"\/?>/gi,
      `<meta property="twitter:image" content="${imageUrl}" />`
    )
    .replace(
      /<meta property="og:title" content="[^"]*"\/?>/gi,
      `<meta property="og:title" content="${title}" />`
    )
    .replace(
      /<meta property="twitter:title" content="[^"]*"\/?>/gi,
      `<meta property="twitter:title" content="${title}" />`
    )
    .replace(
      /<meta property="og:description" content="[^"]*"\/?>/gi,
      `<meta property="og:description" content="${description}" />`
    )
    .replace(
      /<meta property="twitter:description" content="[^"]*"\/?>/gi,
      `<meta property="twitter:description" content="${description}" />`
    )
    .replace(
      /<meta name="description" content="[^"]*"\/?>/gi,
      `<meta name="description" content="${description}" />`
    )
    .replace(/<title>[^<]*<\/title>/gi, `<title>${title}</title>`);

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
});

app.get('/admin/metrics', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../../../../public/admin/metrics.html'));
});

app.use(express.static(path.join(__dirname, '../../../../public')));

function checkMetricsKey(req: Request, res: Response, next: () => void) {
  const expectedKey = process.env.METRICS_KEY;
  if (!expectedKey) {
    res
      .status(403)
      .json({ error: 'Las métricas no están configuradas o el acceso está deshabilitado.' });
    return;
  }

  const providedKey =
    req.query.key ||
    req.headers['x-api-key'] ||
    (req.headers['authorization']?.startsWith('Bearer ')
      ? req.headers['authorization'].slice(7)
      : undefined);

  if (providedKey !== expectedKey) {
    res
      .status(401)
      .json({ error: 'Acceso no autorizado. Se requiere una clave de métrica válida.' });
    return;
  }

  next();
}

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/stats', cardController.getStats);
app.get('/api/languages', cardController.getLanguages);
app.get('/api/repo', cardController.getRepo);
app.get('/api/rank', cardController.getRank);
app.get('/api/streak', cardController.getStreak);
app.get('/api/trophies', cardController.getTrophies);
app.get('/api/views', cardController.getProfileViews);
app.get('/api/top-repos', cardController.getTopRepos);

app.post('/api/tokens/register', tokenController.register);
app.delete('/api/tokens/revoke', tokenController.revoke);
app.delete('/api/users/purge', tokenController.purge);

app.get('/api/config', (_req, res) => {
  res.json({
    privateStatsComingSoon: process.env.PRIVATE_STATS_COMING_SOON !== 'false'
  });
});

app.get('/api/metrics', checkMetricsKey, metricsController.getMetrics);
app.get('/api/metrics/history', checkMetricsKey, metricsController.getRendersHistory);
app.get('/api/metrics/users', checkMetricsKey, metricsController.getUserMetrics);
app.get('/api/metrics/users/count', metricsController.getUniqueUsersCount);

const fallbackFileLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
});

// Serve index.html as fallback only for page routes, returning a standard 404 for missing static files
app.get(
  /^\/(?!api|_astro|.*\.(?:css|js|png|jpg|jpeg|gif|svg|ico|txt|xml)$).*$/,
  fallbackFileLimiter,
  (_req, res) => {
    res.sendFile(path.join(__dirname, '../../../../public/index.html'));
  }
);

export async function startServer() {
  await initDatabase();
  await metricsRepo.loadGlobalMetricsCache();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

// Automatically boot the server when executed
startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
