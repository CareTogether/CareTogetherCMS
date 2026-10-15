import { expect, test } from './support/fixtures';
import { ATLANTIS_ROUTE } from './support/constants';
import {
  FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG,
  REFERRALS_FEATURE_FLAG,
} from '../src/featureFlags';

test.use({
  featureFlags: {
    [FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG]: true,
    [REFERRALS_FEATURE_FLAG]: true,
  },
});

for (const width of [1440, 1024, 768, 375]) {
  test(`page titles align across browsers at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 667 });
    const positions: { title: number; grid: number }[] = [];
    for (const title of [
      'Clients',
      'Referrals',
      'Volunteers',
      'Organizations',
    ]) {
      await page.goto(`${ATLANTIS_ROUTE}${title.toLowerCase()}`);
      const heading = page.getByRole('heading', { name: title, exact: true });
      const grid = page.locator('.MuiDataGrid-root');
      await expect(heading).toBeVisible();
      await expect(grid).toBeVisible();
      positions.push({
        title: (await heading.boundingBox())!.y,
        grid: (await grid.boundingBox())!.y,
      });
    }
    expect(
      Math.max(...positions.map((p) => p.title)) -
        Math.min(...positions.map((p) => p.title))
    ).toBeLessThan(1);
    // Mobile descriptions and actions may wrap to different numbers of lines.
    if (width >= 768) {
      expect(
        Math.max(...positions.map((p) => p.grid)) -
          Math.min(...positions.map((p) => p.grid))
      ).toBeLessThanOrEqual(2);
    }
  });

  for (const { route, title, action } of [
    { route: 'clients', title: 'Clients', action: null },
    { route: 'referrals', title: 'Referrals', action: 'Add new referral' },
    {
      route: 'organizations',
      title: 'Organizations',
      action: 'ADD NEW ORGANIZATION',
    },
  ]) {
    test(`${title} header fits at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 667 });
      await page.goto(`${ATLANTIS_ROUTE}${route}`);
      const heading = page.getByRole('heading', { name: title, exact: true });
      await expect(heading).toBeInViewport();
      await expect(page.locator('.MuiDataGrid-root')).toBeVisible();
      if (action) {
        const button = page.getByRole('button', { name: action, exact: true });
        await expect(button).toBeInViewport();
        if (width >= 768) {
          await expect
            .poll(async () => {
              const headingBounds = await heading.boundingBox();
              const actionBounds = await button.boundingBox();
              return Boolean(
                headingBounds &&
                  actionBounds &&
                  actionBounds.y < headingBounds.y + headingBounds.height &&
                  actionBounds.y + actionBounds.height > headingBounds.y
              );
            })
            .toBe(true);
        }
        await button.focus();
        await expect(button).toBeFocused();
      }
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        )
        .toBe(true);
    });
  }
}
