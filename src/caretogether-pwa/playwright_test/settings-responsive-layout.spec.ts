import { expect, test } from './support/fixtures';
import { ATLANTIS_ROUTE } from './support/constants';
import { expectNoHorizontalOverflow } from './support/layout';

test.use({ viewport: { width: 375, height: 500 } });

test('Role editor keeps its table and Save reachable on mobile @pr', async ({
  page,
}) => {
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
  await expectNoHorizontalOverflow(page);
});

test('Location Settings navigation and Save remain reachable on mobile @pr', async ({
  page,
}) => {
  await page.goto(`${ATLANTIS_ROUTE}settings/locations`);
  await expect(
    page.getByRole('heading', { name: 'Basic configuration', exact: true })
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
  const expand = page.getByRole('button', {
    name: 'Expand settings navigation',
  });
  await expand.click();
  const collapse = page.getByRole('button', {
    name: 'Collapse settings navigation',
  });
  await expect(collapse).toHaveAttribute('aria-expanded', 'true');
  await expectNoHorizontalOverflow(page);
  await collapse.click();
  await expect(expand).toHaveAttribute('aria-expanded', 'false');
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
  await expectNoHorizontalOverflow(page);
});
