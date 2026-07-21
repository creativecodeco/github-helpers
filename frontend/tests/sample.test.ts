import { describe, it, expect } from 'vitest';

describe('Frontend dummy test suite', () => {
  it('should verify the test runner works', () => {
    expect(1 + 1).toBe(2);
  });

  it('should verify DOM environment is available', () => {
    const div = document.createElement('div');
    div.innerHTML = '<span>Hello World</span>';
    expect(div.querySelector('span')?.textContent).toBe('Hello World');
  });
});
