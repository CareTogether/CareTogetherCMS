import { test, expect, Page } from '@playwright/test';

type BrowserFailure = {
  type: 'console' | 'pageerror';
  message: string;
};

type FailureCollector = {
  getFailures: () => BrowserFailure[];
};

function createFailureCollector(page: Page): FailureCollector {
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

  return {
    getFailures: () => failures,
  };
}

async function openHome(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
}

async function expectNoFatalErrorUi(page: Page): Promise<void> {
  await expect(page.locator('body')).toBeVisible();
  await expect(
    page.getByText(
      /unexpected error|something went wrong|application error|monitor_window_timeout/i
    )
  ).toHaveCount(0);
  await expect(page.getByText(/not found|404/i)).toHaveCount(0);
}

async function expectNoBrowserFailures(
  collector: FailureCollector
): Promise<void> {
  expect(collector.getFailures()).toEqual([]);
}

test.describe('frontend smoke', () => {
  test('home route loads without fatal frontend errors', async ({ page }) => {
    const collector = createFailureCollector(page);

    await openHome(page);
    await expectNoFatalErrorUi(page);
    await expectNoBrowserFailures(collector);
  });

  test('side navigation shows core menu items', async ({ page }) => {
    const collector = createFailureCollector(page);

    await openHome(page);

    const sideNavigation = page.getByRole('list', {
      name: /secondary navigation/i,
    });

    await expect(sideNavigation).toBeVisible();
    await expect(sideNavigation.getByText('Dashboard')).toBeVisible();
    await expect(sideNavigation.getByText('Inbox')).toBeVisible();

    await expectNoFatalErrorUi(page);
    await expectNoBrowserFailures(collector);
  });

  test('dashboard reaches a usable state', async ({ page }) => {
    const collector = createFailureCollector(page);

    await openHome(page);

    await expect(
      page
        .getByText(/loading dashboard\.\.\./i)
        .or(page.getByText(/dashboard/i).first())
    ).toBeVisible();

    await expectNoFatalErrorUi(page);
    await expectNoBrowserFailures(collector);
  });
});
