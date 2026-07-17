import { describe, it, expect } from 'vitest';
import {
  recordHit,
  getMetrics,
  getUserMetrics,
  getAllUserMetrics,
  getUniqueUsersCount
} from '../src/metrics';

describe('SQLite Metrics Tracker', () => {
  const uniqueUsername = `testuser_${Math.random().toString(36).substring(7)}`;

  it('should initialize and record global hits correctly', async () => {
    const initialMetrics = getMetrics();
    expect(initialMetrics).toBeDefined();
    expect(initialMetrics.totalRenders).toBeGreaterThanOrEqual(0);

    // Record a stats hit from web
    recordHit('stats', {
      username: uniqueUsername,
      userAgent: 'Mozilla/5.0 Normal Browser',
      referer: 'http://localhost:3000'
    });

    // Record a languages hit from GitHub Camo
    recordHit('languages', {
      username: uniqueUsername,
      userAgent: 'GitHub-Camo/3.1.1',
      referer: 'https://github.com/camo'
    });

    const updatedMetrics = getMetrics();
    expect(updatedMetrics.totalRenders).toBe(initialMetrics.totalRenders + 2);
    expect(updatedMetrics.statsRenders).toBe(initialMetrics.statsRenders + 1);
    expect(updatedMetrics.languagesRenders).toBe(initialMetrics.languagesRenders + 1);
  });

  it('should distinguish web vs github traffic per user in SQLite', async () => {
    // Wait a brief moment for async SQLite writes to finish
    await new Promise((resolve) => setTimeout(resolve, 500));

    const userMetrics = await getUserMetrics(uniqueUsername);
    expect(userMetrics).toBeDefined();
    expect(userMetrics.username).toBe(uniqueUsername);
    expect(userMetrics.stats_web).toBe(1);
    expect(userMetrics.languages_github).toBe(1);
    expect(userMetrics.stats_github).toBe(0);

    const allUsers = await getAllUserMetrics();
    expect(allUsers.length).toBeGreaterThanOrEqual(1);
    expect(allUsers.some((u) => u.username === uniqueUsername)).toBe(true);
  });

  it('should count unique users correctly', async () => {
    const initialCount = await getUniqueUsersCount();
    expect(initialCount).toBeGreaterThanOrEqual(1);

    const newUser = `another_${Math.random().toString(36).substring(7)}`;
    recordHit('stats', {
      username: newUser,
      userAgent: 'Mozilla/5.0 Normal Browser',
      referer: 'http://localhost:3000'
    });

    // Wait a brief moment for SQLite writes to finish
    await new Promise((resolve) => setTimeout(resolve, 500));

    const updatedCount = await getUniqueUsersCount();
    expect(updatedCount).toBe(initialCount + 1);
  });
});
