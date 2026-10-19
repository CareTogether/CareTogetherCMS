import { expect, test } from './support/fixtures';
import { ATLANTIS_ROUTE } from './support/constants';
import { expectNoHorizontalOverflow } from './support/layout';
import { MOBILE_BOTTOM_NAV_HEIGHT } from '../src/Shell/shellLayoutConstants';

test('Dashboard controls remain reachable on a short mobile screen @pr', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 500 });
  await page.goto(ATLANTIS_ROUTE);
  await expect(
    page.getByRole('heading', { name: 'Dashboard', exact: true })
  ).toBeVisible();
  for (const control of [
    page.getByRole('button', { name: 'Actual childcare', exact: true }),
    page.getByRole('button', { name: /^Next /i }).first(),
    page.getByRole('button', { name: /^Previous /i }).first(),
  ]) {
    await control.scrollIntoViewIfNeeded();
    await expect(control).toBeInViewport();
  }
  await expectNoHorizontalOverflow(page);
});

for (const viewport of [
  { width: 375, height: 500 },
  { width: 1280, height: 800 },
]) {
  for (const route of ['clients', 'referrals']) {
    test(`${route} grid fits its container at ${viewport.width}x${viewport.height} @pr`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(`${ATLANTIS_ROUTE}${route}`);
      const grid = page.locator('.MuiDataGrid-root');
      await expect(grid).toBeVisible();
      await expect
        .poll(async () => {
          const bounds = await grid.boundingBox();
          const bottomReservation =
            viewport.width < 900 ? MOBILE_BOTTOM_NAV_HEIGHT : 0;
          return Boolean(
            bounds &&
              bounds.height > 100 &&
              bounds.y + bounds.height <=
                viewport.height - bottomReservation + 1
          );
        })
        .toBe(true);
      await expect
        .poll(() =>
          grid.locator('.MuiDataGrid-virtualScroller').evaluate((element) => {
            element.scrollTop = element.scrollHeight;
            return (
              Math.abs(
                element.scrollHeight - element.clientHeight - element.scrollTop
              ) <= 1
            );
          })
        )
        .toBe(true);
      await expectNoHorizontalOverflow(page);
    });
  }
}
