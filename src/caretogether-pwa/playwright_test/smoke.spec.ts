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
  // Whole words only: the footer shows the build's short commit hash (e.g. 6440494).
  await expect(page.getByText(/\bnot found\b|\b404\b/i)).toHaveCount(0);
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
    await openHome(page);

    const navigation = sideNavigation(page);

    await expect(navigation).toBeVisible();
    await expect(
      navigation.getByRole('button', { name: 'Dashboard', exact: true })
    ).toBeVisible();
    await expect(
      navigation.getByRole('button', { name: 'Calendar', exact: true })
    ).toBeVisible();
    await expect(navigation.getByText('Inbox')).toBeVisible();

    await expectNoFatalErrorUi(page);
  });

  test('location home opens Dashboard and Calendar has its own route', async ({
    page,
  }) => {
    await openHome(page);

    const navigation = sideNavigation(page);
    const dashboard = navigation.getByRole('button', {
      name: 'Dashboard',
      exact: true,
    });
    const calendar = navigation.getByRole('button', {
      name: 'Calendar',
      exact: true,
    });
    const selected = /\bMui-selected\b/;

    await expect(page).toHaveURL(/\/org\/[^/]+\/[^/]+\/$/);
    await expect(
      page.getByRole('heading', { name: 'Dashboard', level: 1 })
    ).toBeVisible();
    await expect(dashboard).toHaveClass(selected);
    await expect(calendar).not.toHaveClass(selected);

    await calendar.click();
    await expect(page).toHaveURL(/\/org\/[^/]+\/[^/]+\/calendar$/);
    await expect(
      page.getByRole('heading', { name: 'Calendar', level: 1 })
    ).toBeVisible();
    await expect(calendar).toHaveClass(selected);
    await expect(dashboard).not.toHaveClass(selected);

    await expectNoFatalErrorUi(page);
  });
});
