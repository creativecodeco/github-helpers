import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';
import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';
import { ITokenRepository } from '@/domain/repositories/ITokenRepository';
import { getDecryptedToken } from '@/infrastructure/security/security';
import { renderStreakCard } from '@/adapters/presenters/streakCard';
import { HitContext } from '@/domain/entities/Metrics';
import { validateUsername } from '@/domain/entities/Validation';

export class GetUserStreakCardUseCase {
  constructor(
    private readonly githubRepo: IGitHubRepository,
    private readonly metricsRepo: IMetricsRepository,
    private readonly tokenRepo?: ITokenRepository
  ) {}

  async execute(
    username: string,
    theme: string,
    overrides: Record<string, string>,
    hitContext?: HitContext
  ): Promise<string> {
    validateUsername(username);

    const userToken = this.tokenRepo ? await getDecryptedToken(username, this.tokenRepo) : undefined;
    const streak = await this.githubRepo.getUserStreak(username, userToken);
    const svg = renderStreakCard(streak, theme, overrides);

    this.metricsRepo.recordHit('streak', hitContext);

    return svg;
  }
}
