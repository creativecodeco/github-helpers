import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TypeORMMetricsRepository } from '@/adapters/repositories/TypeORMMetricsRepository';
import { TypeORMTokenRepository } from '@/adapters/repositories/TypeORMTokenRepository';
import { initDatabase, AppDataSource } from '@/infrastructure/database/database';

describe('TypeORM Metrics Tracker', () => {
  let metricsRepo: TypeORMMetricsRepository;
  let tokenRepo: TypeORMTokenRepository;
  const uniqueUsername = `testuser_${Math.random().toString(36).substring(7)}`;

  beforeAll(async () => {
    process.env.DB_SYNCHRONIZE = 'true';
    AppDataSource.setOptions({ synchronize: true });
    await initDatabase();
    metricsRepo = new TypeORMMetricsRepository();
    await metricsRepo.loadGlobalMetricsCache();
    tokenRepo = new TypeORMTokenRepository();
  });

  afterAll(async () => {
    const { AppDataSource } = await import('@/infrastructure/database/database');
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  it('should initialize and record global hits correctly', async () => {
    const initialMetrics = metricsRepo.getMetrics();
    expect(initialMetrics).toBeDefined();
    expect(initialMetrics.totalRenders).toBeGreaterThanOrEqual(0);

    // Record a stats hit from web
    metricsRepo.recordHit('stats', {
      username: uniqueUsername,
      userAgent: 'Mozilla/5.0 Normal Browser',
      referer: 'http://localhost:3000'
    });

    // Record a languages hit from GitHub Camo
    metricsRepo.recordHit('languages', {
      username: uniqueUsername,
      userAgent: 'GitHub-Camo/3.1.1',
      referer: 'https://github.com/camo'
    });

    // Wait a brief moment for async writes to finish
    await new Promise((resolve) => setTimeout(resolve, 500));

    const updatedMetrics = metricsRepo.getMetrics();
    expect(updatedMetrics.totalRenders).toBe(initialMetrics.totalRenders + 2);
    expect(updatedMetrics.statsRenders).toBe(initialMetrics.statsRenders + 1);
    expect(updatedMetrics.languagesRenders).toBe(initialMetrics.languagesRenders + 1);
  });

  it('should distinguish web vs github traffic per user in TypeORM', async () => {
    // Wait a brief moment for async writes to finish
    await new Promise((resolve) => setTimeout(resolve, 500));

    const userMetrics = await metricsRepo.getUserMetrics(uniqueUsername);
    expect(userMetrics).toBeDefined();
    expect(userMetrics.username).toBe(uniqueUsername);
    expect(userMetrics.stats_web).toBe(1);
    expect(userMetrics.languages_github).toBe(1);
    expect(userMetrics.stats_github).toBe(0);

    const allUsers = await metricsRepo.getAllUserMetrics();
    expect(allUsers.length).toBeGreaterThanOrEqual(1);
    expect(allUsers.some((u) => u.username === uniqueUsername)).toBe(true);
  });

  it('should count unique users correctly', async () => {
    const initialCount = await metricsRepo.getUniqueUsersCount();
    expect(initialCount).toBeGreaterThanOrEqual(1);

    const newUser = `another_${Math.random().toString(36).substring(7)}`;
    metricsRepo.recordHit('stats', {
      username: newUser,
      userAgent: 'Mozilla/5.0 Normal Browser',
      referer: 'http://localhost:3000'
    });

    // Wait a brief moment for database writes to finish
    await new Promise((resolve) => setTimeout(resolve, 500));

    const updatedCount = await metricsRepo.getUniqueUsersCount();
    expect(updatedCount).toBe(initialCount + 1);
  });

  it('should save, retrieve, and delete user tokens correctly', async () => {
    const testUser = `tokenuser_${Math.random().toString(36).substring(7)}`;
    const encryptedToken = 'encrypted_val_123';
    const iv = 'iv_val_123';
    const consentAccepted = true;
    const consentDate = new Date().toISOString();
    const fingerprint = 'fingerprint_val_123';

    // Verify token doesn't exist yet
    const initialToken = await tokenRepo.getToken(testUser);
    expect(initialToken).toBeNull();

    // Save token
    await tokenRepo.saveToken(
      testUser,
      encryptedToken,
      iv,
      consentAccepted,
      consentDate,
      fingerprint
    );

    // Retrieve and verify
    const savedToken = await tokenRepo.getToken(testUser);
    expect(savedToken).not.toBeNull();
    expect(savedToken!.username).toBe(testUser);
    expect(savedToken!.encrypted_token).toBe(encryptedToken);
    expect(savedToken!.iv).toBe(iv);
    expect(savedToken!.consent_accepted).toBe(1);
    expect(savedToken!.consent_date).toBe(consentDate);
    expect(savedToken!.consent_fingerprint).toBe(fingerprint);

    // Delete token
    await tokenRepo.deleteToken(testUser);

    // Verify deletion
    const deletedToken = await tokenRepo.getToken(testUser);
    expect(deletedToken).toBeNull();
  });
});
