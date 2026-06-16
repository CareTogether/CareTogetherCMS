import type { Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import {
  BrowserFailureCollector,
  createBrowserFailureCollector,
  isKnownNonFatalSmokeConsoleMessage,
} from './support/browserFailures';
import { openHome, sideNavigation } from './support/navigation';

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
  collector: BrowserFailureCollector
): Promise<void> {
  expect(collector.getFailures()).toEqual([]);
}

test.describe('frontend smoke @smoke @pr', () => {
  test('home route loads without fatal frontend errors', async ({ page }) => {
    const collector = createBrowserFailureCollector(page, {
      ignoreConsoleMessage: isKnownNonFatalSmokeConsoleMessage,
    });

    await openHome(page);
    await expectNoFatalErrorUi(page);
    await expectNoBrowserFailures(collector);
  });

  test('side navigation shows core menu items', async ({ page }) => {
    const collector = createBrowserFailureCollector(page, {
      ignoreConsoleMessage: isKnownNonFatalSmokeConsoleMessage,
    });

    await openHome(page);

    const navigation = sideNavigation(page);

    await expect(navigation).toBeVisible();
    await expect(navigation.getByText('Dashboard')).toBeVisible();
    await expect(navigation.getByText('Inbox')).toBeVisible();

    await expectNoFatalErrorUi(page);
    await expectNoBrowserFailures(collector);
  });

  test('dashboard reaches a usable state', async ({ page }) => {
    const collector = createBrowserFailureCollector(page, {
      ignoreConsoleMessage: isKnownNonFatalSmokeConsoleMessage,
    });

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
