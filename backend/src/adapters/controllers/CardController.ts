import { Request, Response } from 'express';
import { GetUserStatsCardUseCase } from '@/use-cases/cards/GetUserStatsCardUseCase';
import { GetUserLanguagesCardUseCase } from '@/use-cases/cards/GetUserLanguagesCardUseCase';
import { GetFeaturedRepoCardUseCase } from '@/use-cases/cards/GetFeaturedRepoCardUseCase';
import { GetUserRankCardUseCase } from '@/use-cases/cards/GetUserRankCardUseCase';
import { GetUserStreakCardUseCase } from '@/use-cases/cards/GetUserStreakCardUseCase';
import { GetUserTrophiesCardUseCase } from '@/use-cases/cards/GetUserTrophiesCardUseCase';
import { GetUserTopReposCardUseCase } from '@/use-cases/cards/GetUserTopReposCardUseCase';
import { RecordProfileViewUseCase } from '@/use-cases/metrics/RecordProfileViewUseCase';
import { renderViewsBadge } from '@/adapters/presenters/viewsBadge';

const GITHUB_USERNAME_REGEX = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const GITHUB_REPO_REGEX = /^[a-z\d-_.]{1,100}$/i;

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
  const mappings: Record<string, string[]> = {
    bg: ['bg', 'bg_color'],
    text: ['text', 'text_color'],
    title: ['title', 'title_color'],
    accent: ['accent', 'icon_color', 'accent_color'],
    secondary: ['secondary', 'secondary_color'],
    border: ['border', 'border_color'],
    bgGradient: ['bgGradient', 'bg_gradient']
  };

  for (const [targetKey, paramKeys] of Object.entries(mappings)) {
    for (const key of paramKeys) {
      const val = query[key];
      if (typeof val === 'string' && val.trim() !== '') {
        overrides[targetKey] = val;
        break;
      }
    }
  }
  return overrides;
}

function extractCardWidth(query: Record<string, any>): string | undefined {
  const fullWidth = query.full_width === 'true' || query.full_width === '1';
  if (fullWidth) return '100%';
  const widthVal = query.card_width || query.width;
  if (typeof widthVal === 'string' && widthVal.trim() !== '') {
    return widthVal.trim();
  }
  return undefined;
}

export class CardController {
  constructor(
    private readonly statsCardUseCase: GetUserStatsCardUseCase,
    private readonly languagesCardUseCase: GetUserLanguagesCardUseCase,
    private readonly repoCardUseCase: GetFeaturedRepoCardUseCase,
    private readonly rankCardUseCase: GetUserRankCardUseCase,
    private readonly streakCardUseCase: GetUserStreakCardUseCase,
    private readonly trophiesCardUseCase: GetUserTrophiesCardUseCase,
    private readonly recordProfileViewUseCase: RecordProfileViewUseCase,
    private readonly topReposCardUseCase: GetUserTopReposCardUseCase
  ) {}

  getStats = async (req: Request, res: Response): Promise<void> => {
    const { username, theme } = req.query;

    if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(400).send(renderErrorCard('Usuario de GitHub inválido'));
      return;
    }

    try {
      const cardWidth = extractCardWidth(req.query);
      const overrides = {
        ...extractThemeOverrides(req.query),
        ...(cardWidth ? { cardWidth } : {})
      };
      const hitContext = {
        username,
        userAgent: req.headers['user-agent'],
        referer: req.headers['referer'],
        ip: req.ip
      };

      const svg = await this.statsCardUseCase.execute(
        username,
        theme as string,
        overrides,
        hitContext
      );

      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=7200');
      res.status(200).send(svg);
    } catch (error: any) {
      console.error(`Error in getStats for ${username}:`, error);
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(500).send(renderErrorCard(error.message || 'Error al obtener datos'));
    }
  };

  getLanguages = async (req: Request, res: Response): Promise<void> => {
    const { username, theme } = req.query;

    if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(400).send(renderErrorCard('Usuario de GitHub inválido'));
      return;
    }

    try {
      const cardWidth = extractCardWidth(req.query);
      const overrides = {
        ...extractThemeOverrides(req.query),
        ...(cardWidth ? { cardWidth } : {})
      };
      const hitContext = {
        username,
        userAgent: req.headers['user-agent'],
        referer: req.headers['referer'],
        ip: req.ip
      };

      const svg = await this.languagesCardUseCase.execute(
        username,
        theme as string,
        overrides,
        hitContext
      );

      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=7200');
      res.status(200).send(svg);
    } catch (error: any) {
      console.error(`Error in getLanguages for ${username}:`, error);
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(500).send(renderErrorCard(error.message || 'Error al obtener datos'));
    }
  };

  getRepo = async (req: Request, res: Response): Promise<void> => {
    const { username, repo, theme } = req.query;

    if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(400).send(renderErrorCard('Usuario de GitHub inválido'));
      return;
    }

    if (repo && (typeof repo !== 'string' || !GITHUB_REPO_REGEX.test(repo))) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(400).send(renderErrorCard('Repositorio de GitHub inválido'));
      return;
    }

    try {
      const cardWidth = extractCardWidth(req.query);
      const overrides = {
        ...extractThemeOverrides(req.query),
        ...(cardWidth ? { cardWidth } : {})
      };
      const hitContext = {
        username,
        userAgent: req.headers['user-agent'],
        referer: req.headers['referer'],
        ip: req.ip
      };

      const svg = await this.repoCardUseCase.execute(
        username,
        (repo as string) || undefined,
        theme as string,
        overrides,
        hitContext
      );

      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=7200');
      res.status(200).send(svg);
    } catch (error: any) {
      console.error(`Error in getRepo for ${username}/${repo || 'featured'}:`, error);
      res.setHeader('Content-Type', 'image/svg+xml');
      res
        .status(500)
        .send(renderErrorCard(error.message || 'Error al obtener datos del repositorio'));
    }
  };

  getRank = async (req: Request, res: Response): Promise<void> => {
    const { username, theme } = req.query;

    if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(400).send(renderErrorCard('Usuario de GitHub inválido'));
      return;
    }

    try {
      const cardWidth = extractCardWidth(req.query);
      const overrides = {
        ...extractThemeOverrides(req.query),
        ...(cardWidth ? { cardWidth } : {})
      };
      const hitContext = {
        username,
        userAgent: req.headers['user-agent'],
        referer: req.headers['referer'],
        ip: req.ip
      };

      const svg = await this.rankCardUseCase.execute(
        username,
        theme as string,
        overrides,
        hitContext
      );

      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=7200');
      res.status(200).send(svg);
    } catch (error: any) {
      console.error(`Error in getRank for ${username}:`, error);
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(500).send(renderErrorCard(error.message || 'Error al obtener datos'));
    }
  };

  getStreak = async (req: Request, res: Response): Promise<void> => {
    const { username, theme } = req.query;

    if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(400).send(renderErrorCard('Usuario de GitHub inválido'));
      return;
    }

    try {
      const cardWidth = extractCardWidth(req.query);
      const overrides = {
        ...extractThemeOverrides(req.query),
        ...(cardWidth ? { cardWidth } : {})
      };
      const hitContext = {
        username,
        userAgent: req.headers['user-agent'],
        referer: req.headers['referer'],
        ip: req.ip
      };

      const svg = await this.streakCardUseCase.execute(
        username,
        theme as string,
        overrides,
        hitContext
      );

      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=7200');
      res.status(200).send(svg);
    } catch (error: any) {
      console.error(`Error in getStreak for ${username}:`, error);
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(500).send(renderErrorCard(error.message || 'Error al obtener datos'));
    }
  };

  getTrophies = async (req: Request, res: Response): Promise<void> => {
    const { username, theme } = req.query;

    if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(400).send(renderErrorCard('Usuario de GitHub inválido'));
      return;
    }

    try {
      const cardWidth = extractCardWidth(req.query);
      const overrides = {
        ...extractThemeOverrides(req.query),
        ...(cardWidth ? { cardWidth } : {})
      };
      const hitContext = {
        username,
        userAgent: req.headers['user-agent'],
        referer: req.headers['referer'],
        ip: req.ip
      };

      const svg = await this.trophiesCardUseCase.execute(
        username,
        theme as string,
        overrides,
        hitContext
      );

      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=7200');
      res.status(200).send(svg);
    } catch (error: any) {
      console.error(`Error in getTrophies for ${username}:`, error);
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(500).send(renderErrorCard(error.message || 'Error al obtener datos'));
    }
  };

  getProfileViews = async (req: Request, res: Response): Promise<void> => {
    const { username, theme, color, label, style } = req.query;

    if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(400).send(renderErrorCard('Usuario de GitHub inválido'));
      return;
    }

    try {
      const userAgent = req.headers['user-agent'] as string | undefined;
      const referer = req.headers['referer'] as string | undefined;

      const viewsCount = await this.recordProfileViewUseCase.execute(username, userAgent, referer);

      const svg = renderViewsBadge(
        viewsCount,
        label as string | undefined,
        color as string | undefined,
        theme as string | undefined,
        style as string | undefined
      );

      res.setHeader('Content-Type', 'image/svg+xml');
      // Prevent GitHub Camo caching to keep it real-time
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.status(200).send(svg);
    } catch (error: any) {
      console.error(`Error in getProfileViews for ${username}:`, error);
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(500).send(renderErrorCard(error.message || 'Error al obtener visitas'));
    }
  };

  getTopRepos = async (req: Request, res: Response): Promise<void> => {
    const { username, theme } = req.query;

    if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(400).send(renderErrorCard('Usuario de GitHub inválido'));
      return;
    }

    try {
      const cardWidth = extractCardWidth(req.query);
      const overrides = {
        ...extractThemeOverrides(req.query),
        ...(cardWidth ? { cardWidth } : {})
      };

      const svg = await this.topReposCardUseCase.execute(username, theme as string, overrides);

      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=7200');
      res.status(200).send(svg);
    } catch (error: any) {
      console.error(`Error in getTopRepos for ${username}:`, error);
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(500).send(renderErrorCard(error.message || 'Error al obtener repositorios'));
    }
  };
}
