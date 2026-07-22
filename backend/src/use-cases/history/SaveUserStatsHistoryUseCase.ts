import { AppDataSource } from '@/infrastructure/database/database';
import { UserStatsHistory } from '@/infrastructure/database/entities/UserStatsHistory';
import { UserStats } from '@/domain/entities/UserStats';

export class SaveUserStatsHistoryUseCase {
  private updateEntry(
    entry: UserStatsHistory,
    stats?: Partial<UserStats>,
    languages?: Record<string, number>
  ): void {
    if (stats) {
      if (stats.totalStars !== undefined) entry.stars = stats.totalStars;
      if (stats.totalCommits !== undefined) entry.commits = stats.totalCommits;
      if (stats.totalPRs !== undefined) entry.prs = stats.totalPRs;
      if (stats.totalIssues !== undefined) entry.issues = stats.totalIssues;
      if (stats.followers !== undefined) entry.followers = stats.followers;
    }
    if (languages) {
      entry.languages = { ...entry.languages, ...languages };
    }
  }

  private createEntry(
    username: string,
    lastEntry: UserStatsHistory | null,
    stats?: Partial<UserStats>,
    languages?: Record<string, number>
  ): UserStatsHistory {
    const newEntry = new UserStatsHistory();
    newEntry.username = username;

    newEntry.stars = stats?.totalStars ?? lastEntry?.stars ?? 0;
    newEntry.commits = stats?.totalCommits ?? lastEntry?.commits ?? 0;
    newEntry.prs = stats?.totalPRs ?? lastEntry?.prs ?? 0;
    newEntry.issues = stats?.totalIssues ?? lastEntry?.issues ?? 0;
    newEntry.followers = stats?.followers ?? lastEntry?.followers ?? 0;

    const lastLanguages = lastEntry?.languages || {};
    newEntry.languages = languages ? { ...lastLanguages, ...languages } : lastLanguages;

    return newEntry;
  }

  async execute(
    username: string,
    stats?: Partial<UserStats>,
    languages?: Record<string, number>
  ): Promise<void> {
    try {
      const historyRepo = AppDataSource.getRepository(UserStatsHistory);
      const frequencyHours = Number.parseInt(process.env.STATS_HISTORY_FREQUENCY_HOURS || '12', 10);
      const cutoffTime = new Date(Date.now() - frequencyHours * 60 * 60 * 1000);

      // Find the last recorded history entry for the user
      const lastEntry = await historyRepo.findOne({
        where: { username },
        order: { recorded_at: 'DESC' }
      });

      if (lastEntry && lastEntry.recorded_at >= cutoffTime) {
        this.updateEntry(lastEntry, stats, languages);
        await historyRepo.save(lastEntry);
      } else {
        const newEntry = this.createEntry(username, lastEntry, stats, languages);
        await historyRepo.save(newEntry);
      }
    } catch (error) {
      console.error(`Failed to save user stats history for ${username}:`, error);
    }
  }
}
