import { test, expect } from '@playwright/test';

test.describe('GitHub Helpers App E2E Tests', () => {
  test.beforeEach(async ({ context, page }) => {
    // Grant clipboard permissions for copy testing
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Mock config endpoint to enable token interaction (no pointer-events: none)
    await page.route('**/api/config*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ privateStatsComingSoon: false })
      });
    });

    // Mock all backend card endpoints to return valid mock SVGs instantly
    const mockSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="195"><rect width="100%" height="100%" fill="#0d1117"/><text x="20" y="30" fill="#fff">Mock Card</text></svg>`;
    
    await page.route('**/api/stats*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: mockSvg });
    });
    await page.route('**/api/languages*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: mockSvg });
    });
    await page.route('**/api/repo*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: mockSvg });
    });
    await page.route('**/api/rank*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: mockSvg });
    });
    await page.route('**/api/streak*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: mockSvg });
    });
    await page.route('**/api/trophies*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: mockSvg });
    });
    await page.route('**/api/top-repos*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: mockSvg });
    });
    await page.route('**/api/views*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: mockSvg });
    });

    // Navigate to homepage
    await page.goto('/');
  });

  test('should load the page and show initial components', async ({ page }) => {
    // Check main title
    await expect(page.locator('h1')).toContainText('GitHub Helpers');
    
    // Check configuration section is visible
    await expect(page.locator('h2.section-title').first()).toContainText('Configuración');
    
    // Inputs are visible
    await expect(page.locator('#username-input')).toBeVisible();
    await expect(page.locator('#repo-input')).toBeVisible();
    await expect(page.locator('#btn-generate')).toBeVisible();
  });

  test('should generate stats cards on click', async ({ page }) => {
    // Type username
    await page.fill('#username-input', 'creativecode');
    
    // Click generate button
    await page.click('#btn-generate');
    
    // Check that images are loading / loaded
    const statsImg = page.locator('#stats-img');
    await expect(statsImg).toBeVisible();
    const src = await statsImg.getAttribute('src');
    expect(src).toContain('/api/stats?username=creativecode');
  });

  test('should update query parameters when selecting theme', async ({ page }) => {
    // Fill username and generate
    await page.fill('#username-input', 'creativecode');
    await page.click('#btn-generate');
    
    // Select radical theme
    await page.click('#theme-radical');
    
    // Wait for the stats code block to be updated
    const statsCode = page.locator('#markdown-stats-code');
    await expect(statsCode).toContainText('theme=radical');
    
    // Verify that theme option has class active
    await expect(page.locator('#theme-radical')).toHaveClass(/active/);
  });

  test('should open and close the GDPR Purge Modal correctly', async ({ page }) => {
    // Mock registered state via localStorage so the purge trigger button is shown
    await page.evaluate(() => {
      localStorage.setItem('registered-github-username', 'creativecode');
    });
    
    // Reload page to apply changes
    await page.reload();

    // Wait for private token container to be interactive
    const tokenForm = page.locator('#token-form-container');
    await expect(tokenForm).toHaveCSS('pointer-events', 'auto');

    // The purge modal trigger should now be visible
    const purgeBtn = page.locator('#btn-open-purge-modal');
    await expect(purgeBtn).toBeVisible();
    
    // Click to open
    await purgeBtn.click();
    
    // Verify modal is visible (does not have hidden class)
    const modal = page.locator('#purge-modal');
    await expect(modal).toBeVisible();
    await expect(modal).not.toHaveClass(/hidden/);
    
    // Click close
    await page.click('#btn-close-purge');
    
    // Verify modal is hidden
    await expect(modal).toHaveClass(/hidden/);
  });

  test('should trigger dynamic toast notification when copying markdown', async ({ page }) => {
    // Fill username and generate
    await page.fill('#username-input', 'creativecode');
    await page.click('#btn-generate');
    
    // Verify copy button is visible
    const copyBtn = page.locator('#btn-copy-stats');
    await expect(copyBtn).toBeVisible();
    
    // Click copy button
    await copyBtn.click();
    
    // Check that a success toast appears
    const toast = page.locator('.toast.success');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Código copiado al portapapeles con éxito');
  });

  test('should parse user and theme query parameters from URL on load and generate cards', async ({ page }) => {
    // Navigate with query parameters
    await page.goto('/?user=octocat&theme=nord');

    // Username input should be populated
    const usernameInput = page.locator('#username-input');
    await expect(usernameInput).toHaveValue('octocat');

    // Theme selector should highlight nord
    const themeNord = page.locator('#theme-nord');
    await expect(themeNord).toHaveClass(/active/);

    // Cards should have started generating automatically
    const statsImg = page.locator('#stats-img');
    await expect(statsImg).toBeVisible();
    const src = await statsImg.getAttribute('src');
    expect(src).toContain('/api/stats?username=octocat');
  });

  test('should update browser URL when generating cards or changing themes', async ({ page }) => {
    // Fill username and generate
    await page.fill('#username-input', 'creativecode');
    await page.click('#btn-generate');

    // URL should now contain user=creativecode
    expect(page.url()).toContain('user=creativecode');

    // Click on synthwave theme
    await page.click('#theme-synthwave');

    // URL should now also contain theme=synthwave
    expect(page.url()).toContain('theme=synthwave');
    expect(page.url()).toContain('user=creativecode');
  });
});

