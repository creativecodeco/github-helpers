import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';
import { Metrics, HitContext } from '@/domain/entities/Metrics';
import { AppDataSource } from '@/infrastructure/database/database';
import { GlobalMetric } from '@/infrastructure/database/entities/GlobalMetric';
import { UserMetric } from '@/infrastructure/database/entities/UserMetric';
import { RequestLog } from '@/infrastructure/database/entities/RequestLog';

export class TypeORMMetricsRepository implements IMetricsRepository {
  private globalMetricsCache: Metrics = {
    totalRenders: 0,
    statsRenders: 0,
    languagesRenders: 0,
    repoRenders: 0,
    rankRenders: 0,
    streakRenders: 0,
    trophiesRenders: 0,
    viewsRenders: 0
  };

  constructor() {}

  async loadGlobalMetricsCache() {
    try {
      const globalMetricRepo = AppDataSource.getRepository(GlobalMetric);
      const rows = await globalMetricRepo.find();
      rows.forEach((row) => {
        if (row.metric_key in this.globalMetricsCache) {
          this.globalMetricsCache[row.metric_key as keyof Metrics] = row.metric_value;
        }
      });
    } catch (err) {
      console.error('Error loading global metrics cache:', err);
    }
  }

  recordHit(
    type: 'stats' | 'languages' | 'repo' | 'rank' | 'streak' | 'trophies',
    context?: HitContext
  ): void {
    const username = context?.username || 'unknown';
    const userAgent = context?.userAgent || '';
    const referer = context?.referer || '';
    const ip = context?.ip || '';

    let source = 'web';
    if (
      userAgent.toLowerCase().includes('github-camo') ||
      referer.toLowerCase().includes('github.com') ||
      referer.toLowerCase().includes('camo')
    ) {
      source = 'github';
    }

    // Perform database operations in the background to not block the main request thread, matching previous SQLite repository behavior
    AppDataSource.transaction(async (transactionalEntityManager) => {
      // 1. Increment total renders
      await transactionalEntityManager
        .createQueryBuilder()
        .update(GlobalMetric)
        .set({ metric_value: () => 'metric_value + 1' })
        .where('metric_key = :key', { key: 'totalRenders' })
        .execute();

      // 2. Increment specific card type renders
      await transactionalEntityManager
        .createQueryBuilder()
        .update(GlobalMetric)
        .set({ metric_value: () => 'metric_value + 1' })
        .where('metric_key = :key', { key: `${type}Renders` })
        .execute();

      // 3. Upsert user metrics in a clean, concurrency-safe manner:
      const column = `${type}_${source}`;
      
      // First, insert user row if not exists (using ON CONFLICT DO NOTHING / orIgnore)
      await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(UserMetric)
        .values({ username: username.toLowerCase() })
        .orIgnore()
        .execute();

      // Second, increment the column and update timestamp
      await transactionalEntityManager
        .createQueryBuilder()
        .update(UserMetric)
        .set({
          [column]: () => `"${column}" + 1`,
          last_updated: new Date()
        })
        .where('username = :username', { username: username.toLowerCase() })
        .execute();

      // 4. Log the request
      const requestLogRepo = transactionalEntityManager.getRepository(RequestLog);
      const log = new RequestLog();
      log.username = username.toLowerCase();
      log.card_type = type;
      log.source = source;
      log.user_agent = userAgent;
      log.referer = referer;
      log.ip_address = ip;
      await requestLogRepo.save(log);
    }).then(() => {
      // Update in-memory cache on success
      this.globalMetricsCache.totalRenders += 1;
      const key = `${type}Renders` as keyof Metrics;
      this.globalMetricsCache[key] += 1;
    }).catch((err) => {
      console.error('Failed to record metrics hit in TypeORM:', err);
    });
  }

  getMetrics(): Metrics {
    return { ...this.globalMetricsCache };
  }

  async getUserMetrics(username: string): Promise<any> {
    try {
      const userMetricRepo = AppDataSource.getRepository(UserMetric);
      const row = await userMetricRepo.findOneBy({ username: username.toLowerCase() });
      return row || null;
    } catch (err) {
      console.error('Error fetching user metrics:', err);
      return null;
    }
  }

  async getAllUserMetrics(): Promise<any[]> {
    try {
      const userMetricRepo = AppDataSource.getRepository(UserMetric);
      return await userMetricRepo.find({
        order: { last_updated: 'DESC' }
      });
    } catch (err) {
      console.error('Error fetching all user metrics:', err);
      return [];
    }
  }

  async getUniqueUsersCount(): Promise<number> {
    try {
      const userMetricRepo = AppDataSource.getRepository(UserMetric);
      return await userMetricRepo.count();
    } catch (err) {
      console.error('Error fetching unique users count:', err);
      return 0;
    }
  }

  async getOrIncrementProfileViews(username: string, increment: boolean): Promise<number> {
    try {
      const userMetricRepo = AppDataSource.getRepository(UserMetric);
      
      // Ensure user row exists in user_metrics
      await AppDataSource.createQueryBuilder()
        .insert()
        .into(UserMetric)
        .values({ username: username.toLowerCase() })
        .orIgnore()
        .execute();

      if (increment) {
        // Increment global counters
        await AppDataSource.createQueryBuilder()
          .update(GlobalMetric)
          .set({ metric_value: () => 'metric_value + 1' })
          .where('metric_key = :key', { key: 'totalRenders' })
          .execute();

        await AppDataSource.createQueryBuilder()
          .update(GlobalMetric)
          .set({ metric_value: () => 'metric_value + 1' })
          .where('metric_key = :key', { key: 'viewsRenders' })
          .execute();

        // Increment user's profile views and set last updated
        await AppDataSource.createQueryBuilder()
          .update(UserMetric)
          .set({
            profile_views: () => 'profile_views + 1',
            last_updated: new Date()
          })
          .where('username = :username', { username: username.toLowerCase() })
          .execute();

        // Update local cache
        this.globalMetricsCache.totalRenders += 1;
        this.globalMetricsCache.viewsRenders += 1;
      }

      // Fetch current views
      const row = await userMetricRepo.findOneBy({ username: username.toLowerCase() });
      return row ? row.profile_views : 0;
    } catch (err) {
      console.error(`Error in getOrIncrementProfileViews for ${username}:`, err);
      return 0;
    }
  }
}
