import { describe, it, expect } from 'vitest';
import { renderTopReposCard } from '@/adapters/presenters/topReposCard';
import { RepoStats } from '@/domain/entities/RepoStats';
import { THEMES } from '@/adapters/presenters/theme';

const mockRepos: RepoStats[] = [
  {
    name: 'awesome-project',
    owner: 'creativecode',
    description: 'A stunning open source project built with TypeScript',
    stars: 1200,
    forks: 340,
    language: 'TypeScript',
    languageColor: '#3178c6',
    license: 'MIT'
  },
  {
    name: 'cool-lib',
    owner: 'creativecode',
    description: 'A useful utility library for modern JavaScript development',
    stars: 850,
    forks: 210,
    language: 'JavaScript',
    languageColor: '#f1e05a',
    license: 'Apache-2.0'
  },
  {
    name: 'go-service',
    owner: 'creativecode',
    description: 'High-performance microservice written in Go',
    stars: 320,
    forks: 88,
    language: 'Go',
    languageColor: '#00add8',
    license: 'MIT'
  },
  {
    name: 'python-tools',
    owner: 'creativecode',
    description: 'Collection of Python scripts and automation tools',
    stars: 115,
    forks: 33,
    language: 'Python',
    languageColor: '#3572a5',
    license: 'No License'
  }
];

describe('topReposCard renderer', () => {
  it('should render valid SVG with correct structure', () => {
    const svg = renderTopReposCard(mockRepos, 'dark');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('Top Repositorios');
    expect(svg).toContain('CreativeCode.com.co');
  });

  it('should contain repo names in output', () => {
    const svg = renderTopReposCard(mockRepos, 'dark');
    expect(svg).toContain('awesome-project');
    expect(svg).toContain('cool-lib');
    expect(svg).toContain('go-service');
    expect(svg).toContain('python-tools');
  });

  it('should contain star and fork counts', () => {
    const svg = renderTopReposCard(mockRepos, 'dark');
    expect(svg).toContain('1.2k'); // 1200 stars
    expect(svg).toContain('340');  // 340 forks
  });

  it('should apply theme colors', () => {
    const svgDark = renderTopReposCard(mockRepos, 'dark');
    const svgNord = renderTopReposCard(mockRepos, 'nord');
    // Both are valid SVGs but use different theme colors
    expect(svgDark).toContain(THEMES.dark.bg);
    expect(svgNord).toContain(THEMES.nord.bg);
  });

  it('should support 100% width via cardWidth override', () => {
    const svg = renderTopReposCard(mockRepos, 'dark', { cardWidth: '100%' });
    expect(svg).toContain('width="100%"');
    // viewBox should remain unchanged for coordinate system
    expect(svg).toContain('viewBox="0 0 495 300"');
  });

  it('should support custom pixel width', () => {
    const svg = renderTopReposCard(mockRepos, 'dark', { cardWidth: '600' });
    expect(svg).toContain('width="600"');
  });

  it('should truncate long descriptions', () => {
    const longDesc = 'A'.repeat(100);
    const repos = [{ ...mockRepos[0], description: longDesc }];
    const svg = renderTopReposCard(repos, 'dark');
    // Should not contain raw 100-char string
    expect(svg).not.toContain(longDesc);
    expect(svg).toContain('…');
  });

  it('should render correctly with fewer than 4 repos', () => {
    const twoRepos = mockRepos.slice(0, 2);
    const svg = renderTopReposCard(twoRepos, 'dark');
    expect(svg).toContain('awesome-project');
    expect(svg).toContain('cool-lib');
    expect(svg).not.toContain('go-service');
  });

  it('should apply color overrides', () => {
    const svg = renderTopReposCard(mockRepos, 'dark', {
      bg: '#112233',
      title: '#ff0000'
    });
    expect(svg).toContain('#112233');
    expect(svg).toContain('#ff0000');
  });

  it('should render new themes (catppuccin_mocha, nord, cyberpunk, gruvbox, synthwave)', () => {
    const newThemes = ['catppuccin_mocha', 'nord', 'cyberpunk', 'gruvbox', 'synthwave'];
    for (const theme of newThemes) {
      const svg = renderTopReposCard(mockRepos, theme);
      expect(svg).toContain('<svg');
      expect(svg).toContain('Top Repositorios');
      expect(svg).toContain(THEMES[theme as keyof typeof THEMES].bg);
    }
  });
});
