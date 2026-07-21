import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDatabase, AppDataSource } from '@/infrastructure/database/database';
import { UserStatsHistory } from '@/infrastructure/database/entities/UserStatsHistory';
import { SaveUserStatsHistoryUseCase } from '@/use-cases/history/SaveUserStatsHistoryUseCase';

describe('User Stats History Tracking', () => {
  const saveHistoryUseCase = new SaveUserStatsHistoryUseCase();
  const testUser = `history_user_${Math.random().toString(36).substring(7)}`;

  beforeAll(async () => {
    process.env.DB_SYNCHRONIZE = 'true';
    AppDataSource.setOptions({ synchronize: true });
    await initDatabase();
    process.env.STATS_HISTORY_FREQUENCY_HOURS = '12';
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      // Cleanup test user stats history
      const historyRepo = AppDataSource.getRepository(UserStatsHistory);
      await historyRepo.delete({ username: testUser });
      await AppDataSource.destroy();
    }
  });

  it('should create a new history entry on the first record', async () => {
    const historyRepo = AppDataSource.getRepository(UserStatsHistory);

    // Initial stats payload
    await saveHistoryUseCase.execute(testUser, {
      totalStars: 10,
      totalCommits: 50,
      totalPRs: 5,
      totalIssues: 2,
      followers: 20
    });

    const entries = await historyRepo.find({
      where: { username: testUser },
      order: { recorded_at: 'ASC' }
    });

    expect(entries.length).toBe(1);
    expect(entries[0].stars).toBe(10);
    expect(entries[0].commits).toBe(50);
    expect(entries[0].prs).toBe(5);
    expect(entries[0].issues).toBe(2);
    expect(entries[0].followers).toBe(20);
    expect(entries[0].languages).toEqual({});
  });

  it('should update the same history entry when called within the frequency cutoff', async () => {
    const historyRepo = AppDataSource.getRepository(UserStatsHistory);

    // Update only languages payload
    await saveHistoryUseCase.execute(testUser, undefined, { TypeScript: 5000, JavaScript: 2000 });

    const entries = await historyRepo.find({
      where: { username: testUser },
      order: { recorded_at: 'ASC' }
    });

    // Should still be 1 row, but with merged languages and updated stats
    expect(entries.length).toBe(1);
    expect(entries[0].stars).toBe(10);
    expect(entries[0].languages).toEqual({ TypeScript: 5000, JavaScript: 2000 });

    // Update with new stars
    await saveHistoryUseCase.execute(testUser, { totalStars: 15 }, undefined);

    const entriesAfterUpdate = await historyRepo.find({
      where: { username: testUser }
    });

    expect(entriesAfterUpdate.length).toBe(1);
    expect(entriesAfterUpdate[0].stars).toBe(15);
    expect(entriesAfterUpdate[0].languages).toEqual({ TypeScript: 5000, JavaScript: 2000 });
  });

  it('should create a new entry when frequency hours is configured to 0 (always record)', async () => {
    const historyRepo = AppDataSource.getRepository(UserStatsHistory);

    // Set frequency to 0 to simulate cutoff elapsed
    process.env.STATS_HISTORY_FREQUENCY_HOURS = '0';

    await saveHistoryUseCase.execute(testUser, { totalStars: 20 });

    const entries = await historyRepo.find({
      where: { username: testUser },
      order: { recorded_at: 'ASC' }
    });

    // Should now have 2 entries
    expect(entries.length).toBe(2);
    expect(entries[1].stars).toBe(20);
    // Should inherit languages from the previous entry during creation
    expect(entries[1].languages).toEqual({ TypeScript: 5000, JavaScript: 2000 });
  });
});
