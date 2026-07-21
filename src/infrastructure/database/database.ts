import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { GlobalMetric } from './entities/GlobalMetric';
import { UserMetric } from './entities/UserMetric';
import { RequestLog } from './entities/RequestLog';
import { UserTokenEntity } from './entities/UserTokenEntity';
import { UserStatsHistory } from './entities/UserStatsHistory';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'github_helpers',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [GlobalMetric, UserMetric, RequestLog, UserTokenEntity, UserStatsHistory],
  migrations: [],
  subscribers: []
});

/**
 * Initialize Database connection and seed initial values.
 */
export async function initDatabase(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log('📦 PostgreSQL Data Source has been initialized!');

    // Initialize global counters if they do not exist
    const globalMetricRepo = AppDataSource.getRepository(GlobalMetric);
    const keys = [
      'totalRenders',
      'statsRenders',
      'languagesRenders',
      'repoRenders',
      'rankRenders',
      'streakRenders',
      'trophiesRenders'
    ];

    for (const key of keys) {
      const exists = await globalMetricRepo.findOneBy({ metric_key: key });
      if (!exists) {
        const metric = new GlobalMetric();
        metric.metric_key = key;
        metric.metric_value = 0;
        await globalMetricRepo.save(metric);
      }
    }
  }
}
