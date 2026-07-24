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
  private readonly statsCache = new Map<string, CacheEntry<UserStats>>();
  private readonly languagesCache = new Map<string, CacheEntry<LanguageStat[]>>();
  private readonly repoCache = new Map<string, CacheEntry<RepoStats>>();
  private readonly streakCache = new Map<string, CacheEntry<StreakStats>>();
  private readonly topReposCache = new Map<string, CacheEntry<RepoStats[]>>();

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

  async getUserTopRepos(username: string, limit: number = 4, userToken?: string): Promise<RepoStats[]> {
    const cacheKey = `${username.toLowerCase()}:top:${limit}:${userToken ? 'private' : 'public'}`;
    const cached = this.topReposCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const data = await this.delegate.getUserTopRepos(username, limit, userToken);
    this.topReposCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  async getUserStreak(username: string, userToken?: string): Promise<StreakStats> {
    const cacheKey = `${username.toLowerCase()}:${userToken ? 'private' : 'public'}`;
    const cached = this.streakCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const data = await this.delegate.getUserStreak(username, userToken);
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

    for (const key of this.topReposCache.keys()) {
      if (key.startsWith(`${keyBase}:`)) {
        this.topReposCache.delete(key);
      }
    }

    // Propagate to delegate
    this.delegate.clearCache(username);
  }
}
