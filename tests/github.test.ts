import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserStats, getUserLanguages, getFeaturedRepo } from '../src/github';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('github.ts integration tests (Mocked)', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should successfully get user stats and cache them', async () => {
    // 1. Mock response for profile general info
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        login: 'testuser',
        name: 'Test User',
        avatar_url: 'https://avatar.com/test.png',
        followers: 120,
        public_repos: 4
      })
    });

    // 2. Mock response for repos (page 1)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { name: 'repo1', fork: false, stargazers_count: 5, forks_count: 2 },
        { name: 'repo2', fork: false, stargazers_count: 10, forks_count: 3 }
      ]
    });

    // 3. Mock response for repos (page 2 - empty to break loop)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    // 4. Mock response for commits search
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ total_count: 450 })
    });

    // 5. Mock response for PRs search
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ total_count: 32 })
    });

    // 6. Mock response for Issues search
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ total_count: 15 })
    });

    const stats = await getUserStats('testuser');

    expect(stats.username).toBe('testuser');
    expect(stats.name).toBe('Test User');
    expect(stats.followers).toBe(120);
    expect(stats.publicRepos).toBe(4);
    expect(stats.totalStars).toBe(15);
    expect(stats.forksReceived).toBe(5);
    expect(stats.totalCommits).toBe(450);
    expect(stats.totalPRs).toBe(32);
    expect(stats.totalIssues).toBe(15);

    // Call again to verify cache (should not trigger new fetches, mockFetch calls count should remain the same)
    const callCountBefore = mockFetch.mock.calls.length;
    const cachedStats = await getUserStats('testuser');
    expect(cachedStats).toEqual(stats);
    expect(mockFetch.mock.calls.length).toBe(callCountBefore);
  });

  it('should calculate and sort languages correctly', async () => {
    // Mock response for user repos
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { name: 'r1', fork: false },
        { name: 'r2', fork: false },
        { name: 'r3', fork: false }
      ]
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [] // Page 2 empty
    });

    // Mock individual repository languages endpoints
    // r1: TypeScript (100 KB = 102400 bytes)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ TypeScript: 102400 })
    });
    // r2: JavaScript (300 KB = 307200 bytes)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ JavaScript: 307200 })
    });
    // r3: TypeScript (100 KB = 102400 bytes)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ TypeScript: 102400 })
    });

    const langs = await getUserLanguages('testuser-lang');

    // Total size = 500. JavaScript = 300 (60%), TypeScript = 200 (40%)
    expect(langs.length).toBe(2);
    expect(langs[0].name).toBe('JavaScript');
    expect(langs[0].percentage).toBe(60);
    expect(langs[1].name).toBe('TypeScript');
    expect(langs[1].percentage).toBe(40);
  });

  it('should fetch a specific repository for getFeaturedRepo', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        name: 'custom-repo',
        owner: { login: 'testuser' },
        description: 'A custom repository description',
        stargazers_count: 50,
        forks_count: 10,
        language: 'Rust',
        license: { name: 'MIT License', spdx_id: 'MIT' }
      })
    });

    const repo = await getFeaturedRepo('testuser', 'custom-repo');
    expect(repo.name).toBe('custom-repo');
    expect(repo.stars).toBe(50);
    expect(repo.language).toBe('Rust');
    expect(repo.license).toBe('MIT');
  });

  it('should auto-select the highest starred repo for getFeaturedRepo', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { name: 'low-star', fork: false, stargazers_count: 5, forks_count: 1, language: 'Go' },
        {
          name: 'high-star',
          fork: false,
          stargazers_count: 100,
          forks_count: 20,
          language: 'Python',
          license: { spdx_id: 'Apache-2.0' },
          owner: { login: 'testuser' }
        },
        { name: 'forked-repo', fork: true, stargazers_count: 200 } // Should be ignored because it is a fork
      ]
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [] // Page 2 empty
    });

    const repo = await getFeaturedRepo('testuser');
    expect(repo.name).toBe('high-star');
    expect(repo.stars).toBe(100);
    expect(repo.language).toBe('Python');
    expect(repo.license).toBe('Apache-2.0');
  });
});
