import { expect, test } from './support/fixtures';
import { ATLANTIS_ROUTE } from './support/constants';
import { expectNoHorizontalOverflow } from './support/layout';

test('Volunteers keeps wide columns and Pivot contained on mobile @pr', async ({
  page,
}) => {
  const width = 375;
  await page.setViewportSize({ width, height: 500 });
  await page.goto(`${ATLANTIS_ROUTE}volunteers`);

  const heading = page.getByRole('heading', {
    name: 'Volunteers',
    exact: true,
  });
  const add = page.getByRole('button', { name: 'Add Volunteer Family' });
  const grid = page.locator('.MuiDataGrid-root');
  await expect(heading).toBeVisible();
  await expect(add).toBeInViewport();
  await expect(grid).toBeInViewport();
  await expect(grid.getByRole('treegrid')).toBeVisible();
  await expect(grid.getByRole('columnheader').first()).toBeInViewport();

  await expectNoHorizontalOverflow(page);
  const scroller = grid.locator('.MuiDataGrid-virtualScroller');
  await expect(scroller).toBeInViewport();
  await expect(grid.locator('.MuiDataGrid-row').first()).toBeInViewport();
  await expect
    .poll(() =>
      scroller.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
        return (
          Math.abs(
            element.scrollHeight - element.clientHeight - element.scrollTop
          ) <= 1
        );
      })
    )
    .toBe(true);
  await expect(grid.locator('.MuiDataGrid-row').last()).toBeInViewport();

  await expect
    .poll(() =>
      scroller.evaluate((element) => {
        element.scrollLeft = element.scrollWidth;
        return element.scrollLeft;
      })
    )
    .toBeGreaterThan(0);
  await expectNoHorizontalOverflow(page);

  const pivot = grid.getByRole('button', { name: 'Pivot', exact: true });
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
  await expectNoHorizontalOverflow(page);
  await sidebar.getByRole('button', { name: /close/i }).click();
  await expect(sidebar).toHaveCount(0);
  await expect(add).toBeInViewport();
});
