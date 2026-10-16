import { expect, test } from './support/fixtures';
import { ATLANTIS_ROUTE } from './support/constants';
import { FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG } from '../src/featureFlags';

test.use({
  featureFlags: { [FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG]: true },
});

for (const width of [375, 768, 1024, 1440]) {
  test(`Role editor keeps its table and Save reachable at ${width}x500`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 500 });
    await page.goto(`${ATLANTIS_ROUTE}settings/roles`);
    const roles = page.getByRole('table', { name: 'Roles list' });
    await roles
      .getByRole('listitem')
      .filter({ hasNotText: 'Organization Administrator' })
      .first()
      .click();
    const table = page.getByRole('table');
    await expect(
      table.getByRole('columnheader', { name: 'Permissions', exact: true })
    ).toBeVisible();
    await table.getByRole('row').last().scrollIntoViewIfNeeded();
    await expect(table.getByRole('row').last()).toBeInViewport();
    await expect(
      page.getByRole('button', { name: 'Save', exact: true })
    ).toBeInViewport();
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
      )
      .toBe(true);
  });

  for (const height of [667, 500]) {
    test(`Location Settings stays reachable at ${width}x${height}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto(`${ATLANTIS_ROUTE}settings/locations`);
      await expect(
        page.getByRole('heading', { name: 'Basic configuration', exact: true })
      ).toBeVisible();

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
      if (width < 900) {
        const expand = page.getByRole('button', {
          name: 'Expand settings navigation',
        });
        await expect(expand).toBeVisible();
        await expand.click();
        const collapse = page.getByRole('button', {
          name: 'Collapse settings navigation',
        });
        await expect(collapse).toHaveAttribute('aria-expanded', 'true');
        await expectContained();
        await collapse.click();
        await expect(expand).toHaveAttribute('aria-expanded', 'false');
      }

      const finalField = page.getByRole('combobox', {
        name: 'Referral close reasons',
        exact: true,
      });
      await finalField.scrollIntoViewIfNeeded();
      await expect(finalField).toBeInViewport();
      const save = page.getByRole('button', { name: 'Save', exact: true });
      await save.scrollIntoViewIfNeeded();
      await expect(save).toBeInViewport();
      await expect(save).toBeDisabled();
      await expectContained();
    });
  }
}
