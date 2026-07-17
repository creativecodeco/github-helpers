import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';
import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';
import { ITokenRepository } from '@/domain/repositories/ITokenRepository';
import { decryptToken } from '@/infrastructure/security/security';
import { renderStatsCard } from '@/adapters/presenters/statsCard';
import { HitContext } from '@/domain/entities/Metrics';
import { validateUsername } from '@/domain/entities/Validation';

export class GetUserStatsCardUseCase {
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

    let userToken: string | undefined;
    try {
      const tokenInfo = await this.tokenRepo.getToken(username);
      if (tokenInfo) {
        userToken = decryptToken(tokenInfo.encrypted_token, tokenInfo.iv);
      }
    } catch (e) {
      console.warn(`Could not decrypt token for user ${username}:`, e);
    }

    const stats = await this.githubRepo.getUserStats(username, userToken);
    const svg = await renderStatsCard(stats, theme, overrides);

    this.metricsRepo.recordHit('stats', hitContext);

    return svg;
  }
}
