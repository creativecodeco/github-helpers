import { describe, it, expect } from 'vitest';
import { renderStatsCard } from '../src/adapters/presenters/statsCard';
import { renderLanguagesCard } from '../src/adapters/presenters/languagesCard';
import { renderStreakCard } from '../src/adapters/presenters/streakCard';
import { renderRankCard } from '../src/adapters/presenters/rankCard';
import { renderTopReposCard } from '../src/adapters/presenters/topReposCard';
import { UserStats } from '../src/domain/entities/UserStats';
import { StreakStats } from '../src/domain/entities/StreakStats';
import { LanguageStat } from '../src/domain/entities/LanguageStat';
import { RepoStats } from '../src/domain/entities/RepoStats';

describe('i18n Cards Translations', () => {
  const mockStats: UserStats = {
    username: 'testuser',
    name: 'Test User',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
    totalStars: 120,
    totalCommits: 2500,
    totalPRs: 50,
    totalIssues: 10,
    followers: 12,
    forksReceived: 5,
    publicRepos: 15,
    collaborationIndex: 85,
    rank: 'S'
  };

  const mockStreak: StreakStats = {
    username: 'testuser',
    totalContributions: 350,
    currentStreak: 15,
    currentStreakStart: '2026-07-01',
    currentStreakEnd: '2026-07-15',
    longestStreak: 25,
    longestStreakStart: '2026-06-01',
    longestStreakEnd: '2026-06-25',
    firstContributionDate: '2026-01-01'
  };

  const mockLanguages: LanguageStat[] = [
    { name: 'TypeScript', percentage: 70, color: '#3178c6' },
    { name: 'JavaScript', percentage: 30, color: '#f1e05a' }
  ];

  const mockRepos: RepoStats[] = [
    {
      name: 'hello-world',
      description: 'A simple hello world project',
      stars: 50,
      forks: 5,
      language: 'TypeScript',
      languageColor: '#3178c6',
      license: 'MIT'
    }
  ];

  it('should render stats card in Spanish by default', async () => {
    const svg = await renderStatsCard(mockStats, 'dark');
    expect(svg).toContain('Estrellas:');
    expect(svg).toContain('Seguidores:');
    expect(svg).not.toContain('Stars:');
    expect(svg).not.toContain('Followers:');
  });

  it('should render stats card in English when locale=en is specified', async () => {
    const svg = await renderStatsCard(mockStats, 'dark', { locale: 'en' });
    expect(svg).toContain('Stars:');
    expect(svg).toContain('Followers:');
    expect(svg).not.toContain('Estrellas:');
    expect(svg).not.toContain('Seguidores:');
  });

  it('should render languages card in Spanish by default and English when locale=en', () => {
    const svgEs = renderLanguagesCard(mockLanguages, 'dark', {}, 'testuser');
    expect(svgEs).toContain('Lenguajes Más Usados');

    const svgEn = renderLanguagesCard(mockLanguages, 'dark', { locale: 'en' }, 'testuser');
    expect(svgEn).toContain('Most Used Languages');
    expect(svgEn).not.toContain('Lenguajes Más Usados');
  });

  it('should render streak card with localized labels based on locale', () => {
    const svgEs = renderStreakCard(mockStreak, 'dark', {});
    expect(svgEs).toContain('Total Contribuciones');
    expect(svgEs).toContain('Racha Actual');
    expect(svgEs).toContain('Racha Máxima');

    const svgEn = renderStreakCard(mockStreak, 'dark', { locale: 'en' });
    expect(svgEn).toContain('Total Contributions');
    expect(svgEn).toContain('Current Streak');
    expect(svgEn).toContain('Longest Streak');
  });

  it('should render rank card with localized descriptions based on locale', () => {
    const svgEs = renderRankCard(mockStats, 'dark', {});
    expect(svgEs).toContain('Rango de Desarrollador');
    expect(svgEs).toContain('Índice de Colaboración');
    expect(svgEs).toContain('Desarrollador Legendario / Contribuidor Elite');

    const svgEn = renderRankCard(mockStats, 'dark', { locale: 'en' });
    expect(svgEn).toContain('Developer Rank');
    expect(svgEn).toContain('Collaboration Index');
    expect(svgEn).toContain('Legendary Developer / Elite Contributor');
  });

  it('should render top repos card with localized title based on locale', () => {
    const svgEs = renderTopReposCard(mockRepos, 'dark', {});
    expect(svgEs).toContain('Top Repositorios');

    const svgEn = renderTopReposCard(mockRepos, 'dark', { locale: 'en' });
    expect(svgEn).toContain('Top Repositories');
  });
});
