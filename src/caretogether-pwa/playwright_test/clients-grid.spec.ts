import { expect, test } from './support/fixtures';
import { ATLANTIS_ROUTE } from './support/constants';

test.describe('clients grid @pr', () => {
  test('expands a persisted quick search when the page loads', async ({
    page,
  }) => {
    await page.goto(`${ATLANTIS_ROUTE}clients`);

    const gridToolbar = page.getByRole('toolbar');
    const searchButton = gridToolbar.getByRole('button', {
      name: /^search$/i,
    });
    await expect(searchButton).toBeVisible();
    await searchButton.click();

    const searchInput = gridToolbar.getByRole('searchbox');
    await searchInput.fill('persisted-search-probe');
    await expect(searchInput).toHaveValue('persisted-search-probe');

    await page.reload();

    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveValue('persisted-search-probe');
  });
});
