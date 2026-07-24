import { describe, it, expect } from 'vitest';
import { generateSampleReadme, CardItem } from '../src/utils/readmeGenerator';

describe('Sample README Generator Utility', () => {
  it('should generate Spanish README in vertical layout when locale is es', () => {
    const cards: CardItem[] = [
      { id: 'stats', title: 'GitHub Stats', url: 'https://example.com/api/stats?username=octocat' },
      { id: 'languages', title: 'Lenguajes más usados', url: 'https://example.com/api/languages?username=octocat' }
    ];

    const result = generateSampleReadme('octocat', cards, 'es', 'vertical');
    expect(result).toContain('# ¡Hola! Soy @octocat 👋');
    expect(result).toContain('![GitHub Stats](https://example.com/api/stats?username=octocat)');
    expect(result).toContain('![Lenguajes más usados](https://example.com/api/languages?username=octocat)');
    expect(result).toContain('Generado con [GitHub Helpers]');
  });

  it('should generate English README in grid table layout when layout is grid', () => {
    const cards: CardItem[] = [
      { id: 'stats', title: 'GitHub Stats', url: 'https://example.com/api/stats?username=octocat' },
      { id: 'languages', title: 'Most Used Languages', url: 'https://example.com/api/languages?username=octocat' }
    ];

    const result = generateSampleReadme('octocat', cards, 'en', 'grid');
    expect(result).toContain("# Hi there, I'm @octocat 👋");
    expect(result).toContain('<table border="0">');
    expect(result).toContain('<td valign="top" width="50%">');
    expect(result).toContain('src="https://example.com/api/stats?username=octocat"');
    expect(result).toContain('Generated with [GitHub Helpers]');
  });

  it('should fallback gracefully when no cards are active', () => {
    const result = generateSampleReadme('octocat', [], 'es');
    expect(result).toContain('# ¡Hola! Soy @octocat 👋');
  });
});
