import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';
import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';
import { ITokenRepository } from '@/domain/repositories/ITokenRepository';
import { decryptToken } from '@/infrastructure/security/security';
import { renderRepoCard } from '@/adapters/presenters/repoCard';
import { HitContext } from '@/domain/entities/Metrics';
import { validateUsername, validateRepo } from '@/domain/entities/Validation';

export class GetFeaturedRepoCardUseCase {
  constructor(
    private readonly githubRepo: IGitHubRepository,
    private readonly tokenRepo: ITokenRepository,
    private readonly metricsRepo: IMetricsRepository
  ) {}

  async execute(
    username: string,
    repoName: string | undefined,
    theme: string,
    overrides: Record<string, string>,
    hitContext?: HitContext
  ): Promise<string> {
    validateUsername(username);
    if (repoName) {
      validateRepo(repoName);
    }

    let userToken: string | undefined;
    try {
      const tokenInfo = await this.tokenRepo.getToken(username);
      if (tokenInfo) {
        userToken = decryptToken(tokenInfo.encrypted_token, tokenInfo.iv);
      }
    } catch (e) {
      console.warn(`Could not decrypt token for user ${username}:`, e);
    }

    const repoStats = await this.githubRepo.getFeaturedRepo(username, repoName, userToken);
    const svg = renderRepoCard(repoStats, theme, overrides);

    this.metricsRepo.recordHit('repo', hitContext);

    return svg;
  }
}
