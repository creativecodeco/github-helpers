import { UserStats } from '../entities/UserStats';
import { LanguageStat } from '../entities/LanguageStat';
import { RepoStats } from '../entities/RepoStats';
import { StreakStats } from '../entities/StreakStats';

export interface IGitHubRepository {
  getUserStats(username: string, userToken?: string): Promise<UserStats>;
  getUserLanguages(username: string, userToken?: string): Promise<LanguageStat[]>;
  getFeaturedRepo(username: string, repoName?: string, userToken?: string): Promise<RepoStats>;
  getUserStreak(username: string): Promise<StreakStats>;
  clearCache(username: string): void;
}
