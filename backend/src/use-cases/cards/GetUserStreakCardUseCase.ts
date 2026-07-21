import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';
import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';
import { renderStreakCard } from '@/adapters/presenters/streakCard';
import { HitContext } from '@/domain/entities/Metrics';
import { validateUsername } from '@/domain/entities/Validation';

export class GetUserStreakCardUseCase {
  constructor(
    private readonly githubRepo: IGitHubRepository,
    private readonly metricsRepo: IMetricsRepository
  ) {}

  async execute(
    username: string,
    theme: string,
    overrides: Record<string, string>,
    hitContext?: HitContext
  ): Promise<string> {
    validateUsername(username);

    const streak = await this.githubRepo.getUserStreak(username);
    const svg = renderStreakCard(streak, theme, overrides);

    this.metricsRepo.recordHit('streak', hitContext);

    return svg;
  }
}
