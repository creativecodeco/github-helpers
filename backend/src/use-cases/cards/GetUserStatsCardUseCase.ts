import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';
import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';
import { ITokenRepository } from '@/domain/repositories/ITokenRepository';
import { getDecryptedToken } from '@/infrastructure/security/security';
import { renderStatsCard } from '@/adapters/presenters/statsCard';
import { HitContext } from '@/domain/entities/Metrics';
import { validateUsername } from '@/domain/entities/Validation';

import { SaveUserStatsHistoryUseCase } from '@/use-cases/history/SaveUserStatsHistoryUseCase';

export class GetUserStatsCardUseCase {
  private readonly saveHistoryUseCase = new SaveUserStatsHistoryUseCase();

  constructor(
    private readonly githubRepo: IGitHubRepository,
    private readonly tokenRepo: ITokenRepository,
    private readonly metricsRepo: IMetricsRepository
  ) {}

  async execute(
    username: string,
    theme: string,
    overrides: Record<string, string>,
    hitContext?: HitContext
  ): Promise<string> {
    validateUsername(username);

    const userToken = await getDecryptedToken(username, this.tokenRepo);
    const stats = await this.githubRepo.getUserStats(username, userToken);
    const svg = await renderStatsCard(stats, theme, overrides);

    this.metricsRepo.recordHit('stats', hitContext);

    // Save snapshot of user stats to history asynchronously
    this.saveHistoryUseCase.execute(username, stats).catch((err) => {
      console.error(`Error saving stats history for ${username}:`, err);
    });

    return svg;
  }
}
