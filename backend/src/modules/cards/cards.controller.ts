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
import { renderErrorCard } from '@/adapters/presenters/errorCard';
import { GITHUB_USERNAME_REGEX, GITHUB_REPO_REGEX } from '@/domain/entities/Validation';
import { HitContext } from '@/domain/entities/Metrics';
import { logger } from '@/infrastructure/logging/logger';
import { extractThemeOverrides, extractCardWidth } from './card-query.helpers';

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
      hitContext?: HitContext
    ) => Promise<string>
  ): Promise<void> {
    const query = (req.query as Record<string, unknown>) ?? {};
    const username = query.username;
    const theme = query.theme;

    if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
      res.type('image/svg+xml').status(400).send(renderErrorCard('Usuario de GitHub inválido'));
      return;
    }

    try {
      const cardWidth = extractCardWidth(query);
      const overrides = {
        ...extractThemeOverrides(query),
        ...(cardWidth ? { cardWidth } : {}),
      };
      const hitContext: HitContext = {
        username,
        userAgent: req.headers['user-agent'],
        referer: req.headers['referer'] as string | undefined,
        ip: req.ip,
      };

      const svg = await executeUseCase(username, theme as string, overrides, hitContext);

      res
        .type('image/svg+xml')
        .header('Cache-Control', 'public, max-age=7200')
        .status(200)
        .send(svg);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener datos';
      logger.error(`Error rendering card ${cardName} for user ${username}`, { cardName, username, error });
      res.type('image/svg+xml').status(500).send(renderErrorCard(message));
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
    const query = (req.query as Record<string, unknown>) ?? {};
    const repo = query.repo;

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
    const query = (req.query as Record<string, unknown>) ?? {};
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener visitas';
      logger.error(`Error in getProfileViews for user ${username}`, { username, error });
      res.type('image/svg+xml').status(500).send(renderErrorCard(message));
    }
  }

  @Get('top-repos')
  async getTopRepos(@Req() req: FastifyRequest, @Res() res: FastifyReply): Promise<void> {
    await this.handleCardRequest(req, res, 'TopRepos', (u, t, o) =>
      this.topReposCardUseCase.execute(u, t, o)
    );
  }
}
