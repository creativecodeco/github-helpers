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

  test('should synchronize and propagate the locale parameter correctly', async ({ page }) => {
    // Generate cards
    await page.fill('#username-input', 'creativecode');
    await page.click('#btn-generate');

    // Change language to english
    await page.selectOption('#locale-select', 'en');

    // URL should update to include locale=en
    expect(page.url()).toContain('locale=en');

    // Preview code blocks should contain &locale=en
    const statsCode = page.locator('#markdown-stats-code');
    await expect(statsCode).toContainText('&locale=en');

    // Image source should contain &locale=en
    const statsImg = page.locator('#stats-img');
    const src = await statsImg.getAttribute('src');
    expect(src).toContain('&locale=en');
  });

  test('should translate the landing page UI dynamically when changing locale', async ({ page }) => {
    // Initially, it should be Spanish
    await expect(page.locator('h2.section-title').first()).toContainText('Configuración');
    
    // Change to English
    await page.selectOption('#locale-select', 'en');
    
    // Title should update to English
    await expect(page.locator('h2.section-title').first()).toContainText('Configuration');
    
    // Verify placeholders updated
    const usernameInput = page.locator('#username-input');
    await expect(usernameInput).toHaveAttribute('placeholder', 'e.g. github');

    // Verify footer version or rights updated
    const rights = page.locator('[data-i18n="footer_rights"]');
    await expect(rights).toContainText('All rights reserved.');

    // Switch back to Spanish
    await page.selectOption('#locale-select', 'es');
    await expect(page.locator('h2.section-title').first()).toContainText('Configuración');
    await expect(usernameInput).toHaveAttribute('placeholder', 'ej. github');
  });
});

test.describe('Admin Metrics Dashboard E2E Tests', () => {
  test('should show auth screen initially and fail on invalid key', async ({ page }) => {
    // Mock the backend API with a 401 response for invalid keys
    await page.route(/\/api\/metrics/, async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Acceso no autorizado' })
      });
    });

    // Go to admin metrics dashboard
    await page.goto('/admin/metrics');

    // Verify login panel is visible
    await expect(page.locator('#auth-panel')).toBeVisible();
    await expect(page.locator('#analytics-panel')).toBeHidden();

    // Type invalid key and validate
    await page.fill('#metrics-key-input', 'invalidkey');
    await page.click('#btn-login-metrics');

    // Error message should be visible
    const errorMsg = page.locator('#auth-error-msg');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('Clave incorrecta');
  });

  test('should unlock dashboard and render charts/tables on valid key', async ({ page }) => {
    // Add page log listeners
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    const validKey = 'correctmetricskey';

    // Mock backend metrics data
    const mockGlobalMetrics = {
      totalRenders: 1250,
      statsRenders: 400,
      languagesRenders: 300,
      repoRenders: 150,
      rankRenders: 100,
      streakRenders: 100,
      trophiesRenders: 100,
      viewsRenders: 100
    };

    const mockUserMetrics = [
      {
        username: 'octocat',
        stats_web: 50,
        stats_github: 20,
        languages_web: 30,
        languages_github: 10,
        profile_views: 150,
        last_updated: '2026-07-21T10:00:00.000Z'
      }
    ];

    // Mock global and user metrics request
    await page.route(/\/api\/metrics/, async (route) => {
      const url = new URL(route.request().url());
      console.log('INTERCEPTED METRICS REQ:', url.toString(), 'Path:', url.pathname);
      if (url.pathname.includes('/api/metrics/users')) {
        console.log('RESPONDING WITH USER METRICS');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockUserMetrics)
        });
      } else if (url.pathname.includes('/api/metrics/history')) {
        console.log('RESPONDING WITH HISTORY METRICS');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { date: '2026-07-20', count: 150 },
            { date: '2026-07-21', count: 160 }
          ])
        });
      } else {
        console.log('RESPONDING WITH GLOBAL METRICS');
        const key = url.searchParams.get('key');
        if (key === validKey) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockGlobalMetrics)
          });
        } else {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Acceso no autorizado' })
          });
        }
      }
    });

    // Go to admin metrics dashboard
    await page.goto('/admin/metrics');
    await page.fill('#metrics-key-input', validKey);
    await page.click('#btn-login-metrics');

    // Login panel should disappear, analytics panel should show
    await expect(page.locator('#auth-panel')).toBeHidden();
    await expect(page.locator('#analytics-panel')).toBeVisible();

    // Check KPIs are rendered correctly
    await expect(page.locator('#kpi-renders')).toHaveText(/1[.,]250/);
    await expect(page.locator('#kpi-users')).toHaveText('1');
    await expect(page.locator('#kpi-views')).toHaveText('100');

    // Check recent user is rendered in table
    const tableBody = page.locator('#users-table-body');
    await expect(tableBody).toContainText('@octocat');
    await expect(tableBody).toContainText('150'); // profile views
  });

  test('should support searching and client-side pagination on user profiles', async ({ page }) => {
    const validKey = 'correctmetricskey';
    const mockUserMetrics = Array.from({ length: 15 }, (_, i) => ({
      username: `user_${i + 1}`,
      stats_web: 10,
      stats_github: 5,
      languages_web: 5,
      languages_github: 2,
      profile_views: 20 + i,
      last_updated: new Date().toISOString()
    }));

    await page.route(/\/api\/metrics/, async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.includes('/api/metrics/users')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockUserMetrics)
        });
      } else if (url.pathname.includes('/api/metrics/history')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ totalRenders: 100 })
        });
      }
    });

    await page.goto('/admin/metrics');
    await page.fill('#metrics-key-input', validKey);
    await page.click('#btn-login-metrics');

    // Wait for analytics panel
    await expect(page.locator('#analytics-panel')).toBeVisible();

    // With 15 users, table should show page 1 (10 items)
    const tableBody = page.locator('#users-table-body');
    await expect(tableBody.locator('tr')).toHaveCount(10);
    await expect(page.locator('#pagination-info')).toContainText('Mostrando 1-10 de 15');

    // Click Next
    await page.click('#btn-next-page');
    await expect(tableBody.locator('tr')).toHaveCount(5);
    await expect(page.locator('#pagination-info')).toContainText('Mostrando 11-15 de 15');

    // Search for "user_15"
    await page.fill('#search-users-input', 'user_15');
    // Slices table to only matching rows (1 item)
    await expect(tableBody.locator('tr')).toHaveCount(1);
    await expect(page.locator('#pagination-info')).toContainText('Mostrando 1-1 de 1');
    await expect(tableBody).toContainText('@user_15');
  });
});
