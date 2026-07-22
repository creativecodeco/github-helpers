import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDatabase, AppDataSource } from '@/infrastructure/database/database';
import { UserTokenEntity } from '@/infrastructure/database/entities/UserTokenEntity';
import { UserMetric } from '@/infrastructure/database/entities/UserMetric';
import { UserStatsHistory } from '@/infrastructure/database/entities/UserStatsHistory';
import { RequestLog } from '@/infrastructure/database/entities/RequestLog';
import { PurgeUserDataUseCase } from '@/use-cases/users/PurgeUserDataUseCase';

describe('GDPR Purge User Data', () => {
  const purgeUseCase = new PurgeUserDataUseCase();
  const testUser = `purge_user_${Math.random().toString(36).substring(7)}`;

  beforeAll(async () => {
    process.env.DB_SYNCHRONIZE = 'true';
    AppDataSource.setOptions({ synchronize: true });
    await initDatabase();
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  it('should completely purge all user data from all tables', async () => {
    const tokenRepo = AppDataSource.getRepository(UserTokenEntity);
    const metricRepo = AppDataSource.getRepository(UserMetric);
    const historyRepo = AppDataSource.getRepository(UserStatsHistory);
    const logRepo = AppDataSource.getRepository(RequestLog);

    // 1. Insert mock data in all tables

    // UserTokenEntity
    const token = new UserTokenEntity();
    token.username = testUser;
    token.encrypted_token = 'encrypted_val';
    token.iv = 'iv_val';
    token.consent_accepted = true;
    token.consent_date = new Date();
    token.consent_fingerprint = 'fingerprint';
    await tokenRepo.save(token);

    // UserMetric
    const metric = new UserMetric();
    metric.username = testUser;
    metric.stats_web = 10;
    metric.stats_github = 5;
    await metricRepo.save(metric);

    // UserStatsHistory
    const history = new UserStatsHistory();
    history.username = testUser;
    history.stars = 100;
    history.commits = 1000;
    await historyRepo.save(history);

    // RequestLog
    const log = new RequestLog();
    log.username = testUser;
    log.card_type = 'stats';
    log.source = 'web';
    log.ip_address = '127.0.0.1';
    await logRepo.save(log);

    // 2. Verify existence of records
    expect(await tokenRepo.findOneBy({ username: testUser })).not.toBeNull();
    expect(await metricRepo.findOneBy({ username: testUser })).not.toBeNull();

    const initialHistory = await historyRepo.find({ where: { username: testUser } });
    expect(initialHistory).toHaveLength(1);

    const initialLogs = await logRepo.find({ where: { username: testUser } });
    expect(initialLogs).toHaveLength(1);

    // 3. Execute purge
    await purgeUseCase.execute(testUser);

    // 4. Verify total deletion across all tables
    expect(await tokenRepo.findOneBy({ username: testUser })).toBeNull();
    expect(await metricRepo.findOneBy({ username: testUser })).toBeNull();

    const afterHistory = await historyRepo.find({ where: { username: testUser } });
    expect(afterHistory).toHaveLength(0);

    const afterLogs = await logRepo.find({ where: { username: testUser } });
    expect(afterLogs).toHaveLength(0);
  });
});
