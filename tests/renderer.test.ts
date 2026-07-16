import { describe, it, expect, vi } from 'vitest';
import { renderStatsCard } from '../src/renderer/statsCard';
import { renderLanguagesCard } from '../src/renderer/languagesCard';
import { renderRepoCard } from '../src/renderer/repoCard';
import { renderRankCard } from '../src/renderer/rankCard';
import { getTheme, THEMES } from '../src/renderer/theme';
import { UserStats, LanguageStat, RepoStats } from '../src/github';

// Mock fetch for image download
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  headers: {
    get: () => 'image/png'
  },
  arrayBuffer: async () => new ArrayBuffer(8)
});
global.fetch = mockFetch;

describe('renderer tests', () => {
  it('should resolve theme settings correctly', () => {
    const darkTheme = getTheme('dark');
    expect(darkTheme).toEqual(THEMES.dark);

    const glassTheme = getTheme('glassmorphism');
    expect(glassTheme).toEqual(THEMES.glassmorphism);

    // Fallback
    const fallbackTheme = getTheme('non-existent');
    expect(fallbackTheme).toEqual(THEMES.dark);
  });

  it('should render a beautiful stats card SVG', async () => {
    const mockStats: UserStats = {
      username: 'creativecode',
      name: 'Creative Code',
      avatarUrl: 'https://creativecode.com.co/logo.png',
      followers: 1500,
      publicRepos: 42,
      totalStars: 980,
      totalCommits: 3200,
      totalPRs: 210,
      totalIssues: 45,
      forksReceived: 120,
      rank: 'S',
      collaborationIndex: 8
    };

    const svg = await renderStatsCard(mockStats, 'dark');

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('creativecode');
    expect(svg).toContain('Creative Code');
    expect(svg).toContain('3200'); // Commits
    expect(svg).toContain('980'); // Stars
  });

  it('should render a beautiful languages card SVG', () => {
    const mockLangs: LanguageStat[] = [
      { name: 'TypeScript', count: 12, size: 500, percentage: 50, color: '#3178c6' },
      { name: 'JavaScript', count: 8, size: 300, percentage: 30, color: '#f1e05a' },
      { name: 'CSS', count: 4, size: 200, percentage: 20, color: '#563d7c' }
    ];

    const svg = renderLanguagesCard(mockLangs, 'neon');

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('TypeScript');
    expect(svg).toContain('JavaScript');
    expect(svg).toContain('CSS');
    expect(svg).toContain('50%');
    expect(svg).toContain('30%');
    expect(svg).toContain('20%');
  });

  it('should render a beautiful repository card SVG', () => {
    const mockRepo: RepoStats = {
      name: 'github-helpers',
      owner: 'creativecodeco',
      description: 'API microservice to generate profile stats',
      stars: 120,
      forks: 30,
      language: 'TypeScript',
      languageColor: '#3178c6',
      license: 'MIT'
    };

    const svg = renderRepoCard(mockRepo, 'glassmorphism');

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('github-helpers');
    expect(svg).toContain('creativecodeco');
    expect(svg).toContain('API microservice');
    expect(svg).toContain('TypeScript');
    expect(svg).toContain('120'); // Stars
    expect(svg).toContain('30'); // Forks
    expect(svg).toContain('MIT'); // License
  });

  it('should support custom overrides in renderRepoCard', () => {
    const mockRepo: RepoStats = {
      name: 'github-helpers',
      owner: 'creativecodeco',
      description: 'API microservice',
      stars: 120,
      forks: 30,
      language: 'TypeScript',
      languageColor: '#3178c6',
      license: 'MIT'
    };

    const overrides = {
      bg: 'ff0000',
      title: '00ff00',
      accent: '0000ff'
    };

    const svg = renderRepoCard(mockRepo, 'dark', overrides);

    expect(svg).toContain('stop-color="#ff0000"');
    expect(svg).toContain('fill: #00ff00;');
    expect(svg).toContain('fill: #0000ff;');
  });

  it('should render a beautiful rank card SVG', () => {
    const mockStats: UserStats = {
      username: 'creativecode',
      name: 'Creative Code',
      avatarUrl: 'https://creativecode.com.co/logo.png',
      followers: 1500,
      publicRepos: 42,
      totalStars: 980,
      totalCommits: 3200,
      totalPRs: 210,
      totalIssues: 45,
      forksReceived: 120,
      rank: 'S',
      collaborationIndex: 8
    };

    const svg = renderRankCard(mockStats, 'dark');

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('RANK');
    expect(svg).toContain('S');
    expect(svg).toContain('Rango de Desarrollador');
    expect(svg).toContain('8%'); // Collaboration progress index
  });
});
