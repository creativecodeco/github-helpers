import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';
import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';
import { ITokenRepository } from '@/domain/repositories/ITokenRepository';
import { getDecryptedToken } from '@/infrastructure/security/security';
import { renderRankCard } from '@/adapters/presenters/rankCard';
import { HitContext } from '@/domain/entities/Metrics';
import { validateUsername } from '@/domain/entities/Validation';

export class GetUserRankCardUseCase {
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
    const svg = renderRankCard(stats, theme, overrides);

    this.metricsRepo.recordHit('rank', hitContext);

    return svg;
  }
}
