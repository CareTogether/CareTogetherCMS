import { expect, test } from './support/fixtures';
import { openAtlantisHome, sideNavigation } from './support/navigation';

test.describe('volunteer grid filters @pr', () => {
  test('Roles is not Host Family retains non-host volunteer families', async ({
    page,
  }) => {
    await openAtlantisHome(page);
    await sideNavigation(page)
      .getByRole('button', { name: 'Volunteers', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Volunteers', level: 4 })
    ).toBeVisible();
    const grid = page.getByRole('grid');
    const rolesHeader = grid.getByRole('columnheader', { name: /^Roles/ });

    await rolesHeader.hover();
    await rolesHeader
      .getByRole('button', { name: 'Roles column menu' })
      .click();
    await page.getByRole('menuitem', { name: 'Filter', exact: true }).click();
    const operator = page.getByRole('combobox', { name: 'Operator' });
    await operator.click();
    await page
      .getByRole('option', { name: 'does not contain', exact: true })
      .click();
    const value = page.getByRole('combobox', { name: 'Value' });
    await value.click();
    await page
      .getByRole('option', { name: 'Host Family', exact: true })
      .click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toBeHidden();

    await expect(operator).toContainText('does not contain');
    await expect(value).toContainText('Host Family');
    await expect(
      grid.getByText('Emily Coachworthy Family', { exact: true })
    ).toBeVisible();
    await expect(
      grid.getByText('Leia Skywalker Family', { exact: true })
    ).toBeVisible();
    await expect(
      grid.getByText('William Riker Family', { exact: true })
    ).toHaveCount(0);
    await expect(
      grid.getByText('Berrin Brambleswift Family', { exact: true })
    ).toHaveCount(0);
    await expect(
      grid.getByRole('checkbox', { name: 'Select row', exact: true })
    ).toHaveCount(3);
  });
});
