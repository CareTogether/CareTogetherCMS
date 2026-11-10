// Recreates video 1's setup: one draft note on Brambleswift so the Awaiting Review badge shows.
// Run on the Brambleswift family: node record.mjs probe family-screen-v2 /families/3ec519ec-a262-4047-b8ef-5ad8c00a2495 <this file>
export default async (page) => {
  await page.getByRole('button', { name: 'Note', exact: true }).click();
  const drawer = page.locator('.MuiDrawer-paper').filter({ hasText: 'Add New Note' });
  await drawer.waitFor();
  await drawer.getByLabel('Notes').fill('Home visit follow-up: the second bedroom is now set up for a child. Smoke detector still needs a new battery before the next placement.');
  await drawer.getByRole('button', { name: 'Save' }).click();
  await drawer.waitFor({ state: 'hidden' });
  await page.waitForTimeout(2500);
};
