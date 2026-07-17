import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';
import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';
import { ITokenRepository } from '@/domain/repositories/ITokenRepository';
import { decryptToken } from '@/infrastructure/security/security';
import { renderTrophiesCard } from '@/adapters/presenters/trophiesCard';
import { HitContext } from '@/domain/entities/Metrics';
import { validateUsername } from '@/domain/entities/Validation';

export class GetUserTrophiesCardUseCase {
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
    const languages = await this.githubRepo.getUserLanguages(username, userToken);
    const svg = renderTrophiesCard(stats, languages, theme, overrides);

    this.metricsRepo.recordHit('trophies', hitContext);

    return svg;
  }
}
