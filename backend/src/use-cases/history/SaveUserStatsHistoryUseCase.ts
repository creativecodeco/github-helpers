import { AppDataSource } from '@/infrastructure/database/database';
import { UserStatsHistory } from '@/infrastructure/database/entities/UserStatsHistory';
import { UserStats } from '@/domain/entities/UserStats';

export class SaveUserStatsHistoryUseCase {
  async execute(
    username: string,
    stats?: Partial<UserStats>,
    languages?: Record<string, number>
  ): Promise<void> {
    try {
      const historyRepo = AppDataSource.getRepository(UserStatsHistory);
      const frequencyHours = parseInt(process.env.STATS_HISTORY_FREQUENCY_HOURS || '12', 10);
      const cutoffTime = new Date(Date.now() - frequencyHours * 60 * 60 * 1000);

      // Find the last recorded history entry for the user
      const lastEntry = await historyRepo.findOne({
        where: { username },
        order: { recorded_at: 'DESC' }
      });

      if (lastEntry && lastEntry.recorded_at >= cutoffTime) {
        // Update the existing recent entry to merge data
        if (stats) {
          if (stats.totalStars !== undefined) lastEntry.stars = stats.totalStars;
          if (stats.totalCommits !== undefined) lastEntry.commits = stats.totalCommits;
          if (stats.totalPRs !== undefined) lastEntry.prs = stats.totalPRs;
          if (stats.totalIssues !== undefined) lastEntry.issues = stats.totalIssues;
          if (stats.followers !== undefined) lastEntry.followers = stats.followers;
        }
        if (languages) {
          lastEntry.languages = { ...(lastEntry.languages || {}), ...languages };
        }
        await historyRepo.save(lastEntry);
      } else {
        // Create a new entry, merging with the last known data to prevent losing stats/languages
        const newEntry = new UserStatsHistory();
        newEntry.username = username;

        // Use new stats if provided, otherwise fall back to the last known values
        newEntry.stars = stats?.totalStars !== undefined ? stats.totalStars : lastEntry?.stars || 0;
        newEntry.commits =
          stats?.totalCommits !== undefined ? stats.totalCommits : lastEntry?.commits || 0;
        newEntry.prs = stats?.totalPRs !== undefined ? stats.totalPRs : lastEntry?.prs || 0;
        newEntry.issues =
          stats?.totalIssues !== undefined ? stats.totalIssues : lastEntry?.issues || 0;
        newEntry.followers =
          stats?.followers !== undefined ? stats.followers : lastEntry?.followers || 0;

        // Merge languages
        const lastLanguages = lastEntry?.languages || {};
        newEntry.languages = languages ? { ...lastLanguages, ...languages } : lastLanguages;

        await historyRepo.save(newEntry);
      }
    } catch (error) {
      console.error(`Failed to save user stats history for ${username}:`, error);
    }
  }
}
