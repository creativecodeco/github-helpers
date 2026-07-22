import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';
import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';
import { ITokenRepository } from '@/domain/repositories/ITokenRepository';
import { getDecryptedToken } from '@/infrastructure/security/security';
import { renderLanguagesCard } from '@/adapters/presenters/languagesCard';
import { HitContext } from '@/domain/entities/Metrics';
import { validateUsername } from '@/domain/entities/Validation';

import { SaveUserStatsHistoryUseCase } from '@/use-cases/history/SaveUserStatsHistoryUseCase';

export class GetUserLanguagesCardUseCase {
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
    const languages = await this.githubRepo.getUserLanguages(username, userToken);
    const svg = renderLanguagesCard(languages, theme, overrides, username);

    this.metricsRepo.recordHit('languages', hitContext);

    // Convert LanguageStat[] to Record<string, number> for history tracking
    const langRecord: Record<string, number> = {};
    if (Array.isArray(languages)) {
      for (const lang of languages) {
        langRecord[lang.name] = lang.size;
      }
    }

    // Save snapshot of user languages to history asynchronously
    this.saveHistoryUseCase.execute(username, undefined, langRecord).catch((err) => {
      console.error(`Error saving languages history for ${username}:`, err);
    });

    return svg;
  }
}
