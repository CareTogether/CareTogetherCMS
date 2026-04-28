import { test, expect, Page } from '@playwright/test';

type BrowserFailure = {
  type: 'console' | 'pageerror';
  message: string;
};

function collectBrowserFailures(page: Page): BrowserFailure[] {
  const failures: BrowserFailure[] = [];

  page.on('console', (msg) => {
    if (msg.type() !== 'error') {
      return;
    }

    const message = msg.text();

    if (
      /favicon|Failed to load resource: the server responded with a status of 404/i.test(
        message
      )
    ) {
      return;
    }

    failures.push({ type: 'console', message });
  });

  page.on('pageerror', (error) => {
    failures.push({ type: 'pageerror', message: error.message });
  });

  return failures;
}

test.describe('frontend smoke', () => {
  test('dashboard loads without fatal frontend errors', async ({ page }) => {
    const failures = collectBrowserFailures(page);

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('body')).toBeVisible();
    await expect(
      page.getByText(/unexpected error|something went wrong|application error/i)
    ).toHaveCount(0);

    expect(failures).toEqual([]);
  });

  test('side navigation renders core menu items', async ({ page }) => {
    const failures = collectBrowserFailures(page);

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const sideNavigation = page.getByRole('list', {
      name: /secondary navigation/i,
    });

    await expect(sideNavigation).toBeVisible();
    await expect(sideNavigation.getByText('Dashboard')).toBeVisible();
    await expect(sideNavigation.getByText('Inbox')).toBeVisible();

    expect(failures).toEqual([]);
  });

  test('dashboard reaches a usable state', async ({ page }) => {
    const failures = collectBrowserFailures(page);

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await expect(
      page
        .getByText(/loading dashboard\.\.\./i)
        .or(page.getByText(/dashboard/i).first())
    ).toBeVisible();

    await expect(page.getByText(/not found|404/i)).toHaveCount(0);

    expect(failures).toEqual([]);
  });
});
