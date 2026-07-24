import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiGitHubRepository } from '@/adapters/repositories/ApiGitHubRepository';

const apiRepo = new ApiGitHubRepository();
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('GitHub GraphQL API v4 Integration', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.GITHUB_TOKEN = 'test-global-token';
  });

  it('should fetch user stats via GraphQL when GITHUB_TOKEN is present', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          user: {
            login: 'graphqluser',
            name: 'GraphQL User',
            avatarUrl: 'https://avatar.com/gql.png',
            followers: { totalCount: 250 },
            repositories: {
              totalCount: 5,
              nodes: [
                { stargazerCount: 50, forkCount: 10 },
                { stargazerCount: 20, forkCount: 5 }
              ]
            },
            contributionsCollection: {
              totalCommitContributions: 300,
              totalPullRequestContributions: 25,
              totalIssueContributions: 10,
              restrictedContributionsCount: 50
            }
          }
        }
      })
    });

    const stats = await apiRepo.getUserStats('graphqluser');

    expect(stats.username).toBe('graphqluser');
    expect(stats.name).toBe('GraphQL User');
    expect(stats.followers).toBe(250);
    expect(stats.totalStars).toBe(70);
    expect(stats.forksReceived).toBe(15);
    expect(stats.totalCommits).toBe(350); // 300 public + 50 restricted
    expect(stats.totalPRs).toBe(25);
    expect(stats.totalIssues).toBe(10);

    // Verify GraphQL fetch call was made with POST to https://api.github.com/graphql
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.github.com/graphql');
    expect(opts.method).toBe('POST');
    expect(opts.headers.Authorization).toBe('Bearer test-global-token');
  });

  it('should fetch languages in 1 GraphQL query POST request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          user: {
            repositories: {
              nodes: [
                {
                  languages: {
                    edges: [
                      { size: 102400, node: { name: 'TypeScript', color: '#3178c6' } },
                      { size: 51200, node: { name: 'Python', color: '#3572a5' } }
                    ]
                  }
                }
              ]
            }
          }
        }
      })
    });

    const langs = await apiRepo.getUserLanguages('graphqluser');

    expect(langs).toHaveLength(2);
    expect(langs[0].name).toBe('TypeScript');
    expect(langs[0].percentage).toBe(66.7);
    expect(langs[1].name).toBe('Python');
    expect(langs[1].percentage).toBe(33.3);

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.github.com/graphql');
    expect(opts.method).toBe('POST');
  });

  it('should use user PAT when provided for GraphQL queries', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          user: {
            login: 'patuser',
            name: 'PAT User',
            followers: { totalCount: 10 },
            repositories: { totalCount: 1, nodes: [] },
            contributionsCollection: {
              totalCommitContributions: 10,
              totalPullRequestContributions: 0,
              totalIssueContributions: 0,
              restrictedContributionsCount: 100
            }
          }
        }
      })
    });

    await apiRepo.getUserStats('patuser', 'user-pat-token-abc');

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers.Authorization).toBe('Bearer user-pat-token-abc');
  });
});
