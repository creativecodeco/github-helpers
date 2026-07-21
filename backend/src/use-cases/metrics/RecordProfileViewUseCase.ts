import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';
import { validateUsername } from '@/domain/entities/Validation';

export class RecordProfileViewUseCase {
  constructor(private readonly metricsRepo: IMetricsRepository) {}

  async execute(username: string, userAgent?: string, referer?: string): Promise<number> {
    validateUsername(username);

    const ua = (userAgent || '').toLowerCase();
    const ref = (referer || '').toLowerCase();

    // Determine if the request originated from GitHub profile view
    const isGitHubSource =
      ua.includes('github-camo') || ref.includes('github.com') || ref.includes('camo');

    return await this.metricsRepo.getOrIncrementProfileViews(username, isGitHubSource);
  }
}
