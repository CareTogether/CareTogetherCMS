import { expect, test } from './support/fixtures';
import { ATLANTIS_ROUTE } from './support/constants';
import { FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG } from '../src/featureFlags';

test.use({
  featureFlags: { [FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG]: true },
});

for (const width of [1440, 1024, 768, 375]) {
  test(`Volunteers keeps controls and Pivot contained at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 667 });
    await page.goto(`${ATLANTIS_ROUTE}volunteers`);

    const heading = page.getByRole('heading', {
      name: 'Volunteers',
      exact: true,
    });
    const add = page.getByRole('button', { name: 'Add Volunteer Family' });
    const grid = page.getByRole('treegrid');
    await expect(heading).toBeVisible();
    await expect(add).toBeInViewport();
    await expect(grid).toBeVisible();

    async function expectContained() {
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        )
        .toBe(true);
    }

    await expectContained();
    await expect
      .poll(async () => (await grid.boundingBox())?.height ?? 0)
      .toBeGreaterThan(200);

    // Wide columns should scroll inside the grid rather than widening the page.
    const scroller = grid.locator('.MuiDataGrid-virtualScroller');
    await expect
      .poll(() =>
        scroller.evaluate((element) => {
          element.scrollLeft = element.scrollWidth;
          return element.scrollLeft;
        })
      )
      .toBeGreaterThan(0);
    await expectContained();

    const pivot = page.getByRole('button', { name: 'Pivot', exact: true });
    await pivot.focus();
    await pivot.press('Enter');
    const sidebar = page.locator('.MuiDataGrid-sidebar');
    await expect(sidebar).toBeVisible();
    await expect
      .poll(async () => {
        const bounds = await sidebar.boundingBox();
        return Boolean(
          bounds && bounds.x >= 0 && bounds.x + bounds.width <= width + 1
        );
      })
      .toBe(true);
    await expectContained();
    await sidebar.getByRole('button', { name: /close/i }).click();
    await expect(sidebar).toHaveCount(0);
    await expect(add).toBeInViewport();
  });
}
