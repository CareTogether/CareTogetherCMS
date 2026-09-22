import { expect, test } from './support/fixtures';
import { ATLANTIS_ROUTE } from './support/constants';
import { FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG } from '../src/featureFlags';

test.describe('V2 shell', () => {
  test('keeps application context and toggle position when collapsing the sidebar', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await page.goto(`${ATLANTIS_ROUTE}inbox`);
    const header = page.getByRole('banner');
    await expect(
      page.getByRole('heading', { name: 'Inbox', exact: true })
    ).toBeVisible();
    await expect(
      header.getByRole('heading', { name: 'Inbox', exact: true })
    ).toHaveCount(0);
    await expect(
      header.getByText('CareTogether', { exact: true })
    ).toBeVisible();
    await expect(
      header.getByRole('combobox', { name: 'Location', exact: true })
    ).toBeVisible();

    const expand = header.getByRole('button', {
      name: 'Expand sidebar',
      exact: true,
    });
    if (await expand.isVisible()) await expand.click();
    const collapse = header.getByRole('button', {
      name: 'Collapse sidebar',
      exact: true,
    });
    await expect(collapse).toHaveAttribute('aria-expanded', 'true');
    const expandedBounds = await collapse.boundingBox();
    await collapse.click();
    await expect(expand).toHaveAttribute('aria-expanded', 'false');
    const collapsedBounds = await expand.boundingBox();
    expect(collapsedBounds?.x).toBe(expandedBounds?.x);
    await expect(
      header.getByRole('combobox', { name: 'Location', exact: true })
    ).toBeVisible();
    await page.reload();
    await expect(expand).toBeVisible();
    await expand.click();
    await expect(collapse).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  });

  test('retains mobile navigation and location selection in its menu', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${ATLANTIS_ROUTE}inbox`);
    const header = page.getByRole('banner');
    await expect(
      page.getByRole('heading', { name: 'Inbox', exact: true })
    ).toBeVisible();
    await expect(header.getByRole('button', { name: /sidebar/ })).toHaveCount(
      0
    );
    await expect(
      header.getByRole('combobox', { name: 'Location', exact: true })
    ).toHaveCount(0);
    await expect(
      header.getByPlaceholder('Search families and people')
    ).toBeVisible();
    await page
      .locator('.MuiBottomNavigation-root')
      .getByRole('button')
      .first()
      .click();
    await expect(
      page.getByRole('combobox', { name: 'Location', exact: true })
    ).toBeVisible();
  });
});

test.describe('legacy shell', () => {
  test.use({
    featureFlags: { [FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG]: false },
  });

  test('keeps Inbox in the top bar without adding a page heading', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${ATLANTIS_ROUTE}inbox`);
    await expect(
      page
        .getByRole('banner')
        .getByRole('heading', { name: 'Inbox', exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Inbox', exact: true })
    ).toHaveCount(1);
    await expect(
      page.getByRole('banner').getByText('CareTogether', { exact: true })
    ).toHaveCount(0);
  });
});
