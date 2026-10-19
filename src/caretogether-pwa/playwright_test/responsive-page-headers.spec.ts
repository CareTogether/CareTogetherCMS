import { expect, test } from './support/fixtures';
import { ATLANTIS_ROUTE } from './support/constants';
import { expectNoHorizontalOverflow } from './support/layout';

for (const viewport of [
  { width: 375, height: 500 },
  { width: 1280, height: 800 },
]) {
  for (const { route, title, action } of [
    { route: 'referrals', title: 'Referrals', action: 'Add new referral' },
    {
      route: 'organizations',
      title: 'Organizations',
      action: 'ADD NEW ORGANIZATION',
    },
  ]) {
    test(`${title} header fits at ${viewport.width}x${viewport.height} @pr`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(`${ATLANTIS_ROUTE}${route}`);
      const heading = page.getByRole('heading', { name: title, exact: true });
      const button = page.getByRole('button', { name: action, exact: true });
      await expect(heading).toBeInViewport();
      await expect(button).toBeInViewport();
      await expect(page.locator('.MuiDataGrid-root')).toBeVisible();
      if (viewport.width >= 900) {
        await expect
          .poll(async () => {
            const titleBounds = await heading.boundingBox();
            const actionBounds = await button.boundingBox();
            return Boolean(
              titleBounds &&
                actionBounds &&
                actionBounds.y < titleBounds.y + titleBounds.height &&
                actionBounds.y + actionBounds.height > titleBounds.y
            );
          })
          .toBe(true);
      }
      await expectNoHorizontalOverflow(page);
    });
  }
}
