import { Controller, Get, Req, Res } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { GetUserStatsCardUseCase } from '@/use-cases/cards/GetUserStatsCardUseCase';
import { GetUserLanguagesCardUseCase } from '@/use-cases/cards/GetUserLanguagesCardUseCase';
import { GetFeaturedRepoCardUseCase } from '@/use-cases/cards/GetFeaturedRepoCardUseCase';
import { GetUserRankCardUseCase } from '@/use-cases/cards/GetUserRankCardUseCase';
import { GetUserStreakCardUseCase } from '@/use-cases/cards/GetUserStreakCardUseCase';
import { GetUserTrophiesCardUseCase } from '@/use-cases/cards/GetUserTrophiesCardUseCase';
import { GetUserTopReposCardUseCase } from '@/use-cases/cards/GetUserTopReposCardUseCase';
import { RecordProfileViewUseCase } from '@/use-cases/metrics/RecordProfileViewUseCase';
import { renderViewsBadge } from '@/adapters/presenters/viewsBadge';
import { escapeXml } from '@/utils/escape';
import { GITHUB_USERNAME_REGEX, GITHUB_REPO_REGEX } from '@/domain/entities/Validation';
import { logger } from '@/infrastructure/logging/logger';

function renderErrorCard(message: string): string {
  const escapedMessage = escapeXml(message);
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="495" height="195" viewBox="0 0 495 195">
      <rect width="495" height="195" rx="12" fill="#0d1117" stroke="#f85149" stroke-width="2" />
      <g transform="translate(25, 45)">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#f85149" transform="scale(1.5)"/>
        <text x="45" y="18" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="bold" font-size="18" fill="#f85149">Error en GitHub Helpers</text>
        <text x="45" y="42" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="14" fill="#c9d1d9">${escapedMessage}</text>
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

  const loc = query.locale || query.lang;
  if (typeof loc === 'string') {
    const norm = loc.toLowerCase().trim();
    if (norm === 'en' || norm === 'es') {
      overrides.locale = norm;
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

@Controller('api')
export class CardsController {
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

  private async handleCardRequest(
    req: FastifyRequest,
    res: FastifyReply,
    cardName: string,
    executeUseCase: (
      username: string,
      theme: string,
      overrides: Record<string, string>,
      hitContext?: any
    ) => Promise<string>
  ): Promise<void> {
    const query = (req.query as Record<string, any>) || {};
    const { username, theme } = query;

    if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
      res.type('image/svg+xml').status(400).send(renderErrorCard('Usuario de GitHub inválido'));
      return;
    }

    try {
      const cardWidth = extractCardWidth(query);
      const overrides = {
        ...extractThemeOverrides(query),
        ...(cardWidth ? { cardWidth } : {})
      };
      const hitContext = {
        username,
        userAgent: req.headers['user-agent'],
        referer: req.headers['referer'],
        ip: req.ip
      };

      const svg = await executeUseCase(username, theme as string, overrides, hitContext);

      res
        .type('image/svg+xml')
        .header('Cache-Control', 'public, max-age=7200')
        .status(200)
        .send(svg);
    } catch (error: any) {
      logger.error(`Error rendering card ${cardName} for user ${username}`, {
        cardName,
        username,
        error
      });
      res
        .type('image/svg+xml')
        .status(500)
        .send(renderErrorCard(error.message || 'Error al obtener datos'));
    }
  }

  @Get('stats')
  async getStats(@Req() req: FastifyRequest, @Res() res: FastifyReply): Promise<void> {
    await this.handleCardRequest(req, res, 'Stats', (u, t, o, h) =>
      this.statsCardUseCase.execute(u, t, o, h)
    );
  }

  @Get('languages')
  async getLanguages(@Req() req: FastifyRequest, @Res() res: FastifyReply): Promise<void> {
    await this.handleCardRequest(req, res, 'Languages', (u, t, o, h) =>
      this.languagesCardUseCase.execute(u, t, o, h)
    );
  }

  @Get('repo')
  async getRepo(@Req() req: FastifyRequest, @Res() res: FastifyReply): Promise<void> {
    const query = (req.query as Record<string, any>) || {};
    const { repo } = query;
    if (repo && (typeof repo !== 'string' || !GITHUB_REPO_REGEX.test(repo))) {
      res.type('image/svg+xml').status(400).send(renderErrorCard('Repositorio de GitHub inválido'));
      return;
    }

    await this.handleCardRequest(req, res, 'Repo', (u, t, o, h) =>
      this.repoCardUseCase.execute(u, repo as string | undefined, t, o, h)
    );
  }

  @Get('rank')
  async getRank(@Req() req: FastifyRequest, @Res() res: FastifyReply): Promise<void> {
    await this.handleCardRequest(req, res, 'Rank', (u, t, o, h) =>
      this.rankCardUseCase.execute(u, t, o, h)
    );
  }

  @Get('streak')
  async getStreak(@Req() req: FastifyRequest, @Res() res: FastifyReply): Promise<void> {
    await this.handleCardRequest(req, res, 'Streak', (u, t, o, h) =>
      this.streakCardUseCase.execute(u, t, o, h)
    );
  }

  @Get('trophies')
  async getTrophies(@Req() req: FastifyRequest, @Res() res: FastifyReply): Promise<void> {
    await this.handleCardRequest(req, res, 'Trophies', (u, t, o, h) =>
      this.trophiesCardUseCase.execute(u, t, o, h)
    );
  }

  @Get('views')
  async getProfileViews(@Req() req: FastifyRequest, @Res() res: FastifyReply): Promise<void> {
    const query = (req.query as Record<string, any>) || {};
    const { username, theme, color, label, style } = query;

    if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
      res.type('image/svg+xml').status(400).send(renderErrorCard('Usuario de GitHub inválido'));
      return;
    }

    try {
      const userAgent = req.headers['user-agent'] as string | undefined;
      const referer = req.headers['referer'] as string | undefined;

      const viewsCount = await this.recordProfileViewUseCase.execute(username, userAgent, referer);

      const cleanLabel = typeof label === 'string' ? label : undefined;
      const cleanColor = typeof color === 'string' ? color : undefined;
      const cleanTheme = typeof theme === 'string' ? theme : undefined;
      const cleanStyle = typeof style === 'string' ? style : undefined;

      const svg = renderViewsBadge(viewsCount, cleanLabel, cleanColor, cleanTheme, cleanStyle);

      res
        .type('image/svg+xml')
        .header('Cache-Control', 'no-cache, no-store, must-revalidate')
        .header('Pragma', 'no-cache')
        .header('Expires', '0')
        .status(200)
        .send(svg);
    } catch (error: any) {
      logger.error(`Error in getProfileViews for user ${username}`, { username, error });
      res
        .type('image/svg+xml')
        .status(500)
        .send(renderErrorCard(error.message || 'Error al obtener visitas'));
    }
  }

  @Get('top-repos')
  async getTopRepos(@Req() req: FastifyRequest, @Res() res: FastifyReply): Promise<void> {
    await this.handleCardRequest(req, res, 'TopRepos', (u, t, o) =>
      this.topReposCardUseCase.execute(u, t, o)
    );
  }
}
