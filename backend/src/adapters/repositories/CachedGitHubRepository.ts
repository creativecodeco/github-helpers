import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';
import { UserStats } from '@/domain/entities/UserStats';
import { LanguageStat } from '@/domain/entities/LanguageStat';
import { RepoStats } from '@/domain/entities/RepoStats';
import { StreakStats } from '@/domain/entities/StreakStats';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class CachedGitHubRepository implements IGitHubRepository {
  private statsCache = new Map<string, CacheEntry<UserStats>>();
  private languagesCache = new Map<string, CacheEntry<LanguageStat[]>>();
  private repoCache = new Map<string, CacheEntry<RepoStats>>();
  private streakCache = new Map<string, CacheEntry<StreakStats>>();

  private readonly CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

  constructor(private readonly delegate: IGitHubRepository) {}

  async getUserStats(username: string, userToken?: string): Promise<UserStats> {
    const cacheKey = `${username.toLowerCase()}:${userToken ? 'private' : 'public'}`;
    const cached = this.statsCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const data = await this.delegate.getUserStats(username, userToken);
    this.statsCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  async getUserLanguages(username: string, userToken?: string): Promise<LanguageStat[]> {
    const cacheKey = `${username.toLowerCase()}:${userToken ? 'private' : 'public'}`;
    const cached = this.languagesCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const data = await this.delegate.getUserLanguages(username, userToken);
    this.languagesCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  async getFeaturedRepo(
    username: string,
    repoName?: string,
    userToken?: string
  ): Promise<RepoStats> {
    const cacheKey = `${username.toLowerCase()}:${(repoName || '').toLowerCase()}:${userToken ? 'private' : 'public'}`;
    const cached = this.repoCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const data = await this.delegate.getFeaturedRepo(username, repoName, userToken);
    this.repoCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  async getUserStreak(username: string): Promise<StreakStats> {
    const cacheKey = username.toLowerCase();
    const cached = this.streakCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const data = await this.delegate.getUserStreak(username);
    this.streakCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  clearCache(username: string): void {
    const keyBase = username.toLowerCase();
    this.statsCache.delete(`${keyBase}:public`);
    this.statsCache.delete(`${keyBase}:private`);
    this.languagesCache.delete(`${keyBase}:public`);
    this.languagesCache.delete(`${keyBase}:private`);
    this.streakCache.delete(keyBase);

    for (const key of this.repoCache.keys()) {
      if (key.startsWith(`${keyBase}:`)) {
        this.repoCache.delete(key);
      }
    }

    // Propagate to delegate
    this.delegate.clearCache(username);
  }
}
