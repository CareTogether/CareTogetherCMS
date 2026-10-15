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
  for (const height of [667, 500]) {
    test(`Dashboard controls remain reachable at ${width}x${height}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto(ATLANTIS_ROUTE);
      await expect(
        page.getByRole('heading', { name: 'Dashboard', exact: true })
      ).toBeVisible();
      const filter = page.getByRole('button', {
        name: 'Actual childcare',
        exact: true,
      });
      await filter.scrollIntoViewIfNeeded();
      const pressed = await filter.getAttribute('aria-pressed');
      await filter.click();
      await expect(filter).toHaveAttribute(
        'aria-pressed',
        pressed === 'true' ? 'false' : 'true'
      );
      await filter.click();
      const next = page.getByRole('button', { name: /^Next /i }).first();
      await next.scrollIntoViewIfNeeded();
      await expect(next).toBeInViewport();
      await next.click();
      await page
        .getByRole('button', { name: /^Previous /i })
        .first()
        .click();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        )
        .toBe(true);
    });

    for (const route of ['clients', 'referrals']) {
      test(`${route} grid fits its container at ${width}x${height}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height });
        await page.goto(`${ATLANTIS_ROUTE}${route}`);
        const grid = page.locator('.MuiDataGrid-root');
        await expect(grid).toBeVisible();
        await expect
          .poll(async () => {
            const bounds = await grid.boundingBox();
            return Boolean(
              bounds &&
                bounds.height > 100 &&
                bounds.y + bounds.height <= height - (width < 900 ? 56 : 0) + 1
            );
          })
          .toBe(true);
        const scroller = grid.locator('.MuiDataGrid-virtualScroller');
        await expect
          .poll(() =>
            scroller.evaluate((element) => {
              element.scrollTop = element.scrollHeight;
              return (
                Math.abs(
                  element.scrollHeight -
                    element.clientHeight -
                    element.scrollTop
                ) <= 1
              );
            })
          )
          .toBe(true);
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
}
