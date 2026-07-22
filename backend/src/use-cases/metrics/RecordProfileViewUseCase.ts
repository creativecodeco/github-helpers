import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';
import { validateUsername } from '@/domain/entities/Validation';

export class RecordProfileViewUseCase {
  constructor(private readonly metricsRepo: IMetricsRepository) {}

  async execute(username: string, userAgent?: string, referer?: string): Promise<number> {
    validateUsername(username);

    const ua = (userAgent || '').toLowerCase();
    const ref = referer || '';

    // Determine if the request originated from GitHub profile view
    let isGitHubSource = ua.includes('github-camo');
    if (!isGitHubSource && ref) {
      try {
        const parsed = new URL(ref);
        const host = parsed.hostname.toLowerCase();
        isGitHubSource =
          host === 'github.com' ||
          host.endsWith('.github.com') ||
          host === 'camo.githubusercontent.com' ||
          host.endsWith('.githubusercontent.com');
      } catch {
        isGitHubSource = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)*(github\.com|githubusercontent\.com)(\/|$)/i.test(ref);
      }
    }

    return await this.metricsRepo.getOrIncrementProfileViews(username, isGitHubSource);
  }
}
