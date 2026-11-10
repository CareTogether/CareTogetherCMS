// Resets video 3 for a retake: marks Berrin's Comprehensive Background Check incomplete again.
// Run on the Brambleswift family: node record.mjs probe family-screen-v2 /families/3ec519ec-a262-4047-b8ef-5ad8c00a2495 <this file>
export default async (page) => {
  await page.getByRole('tab', { name: /Approvals/i }).click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /^Family Host Family/ }).click();
  await page.waitForTimeout(800);
  await page
    .getByRole('button', { name: /^Completed .*Comprehensive Background Check/ })
    .filter({ hasNotText: 'Elda' })
    .first()
    .click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Mark Incomplete' }).click();
  await page.waitForTimeout(1000);
  await page
    .getByRole('dialog')
    .filter({ hasText: 'Requirement Management' })
    .getByRole('button', { name: 'Mark Incomplete' })
    .click();
  const confirm = page.getByRole('dialog', { name: 'Mark requirement incomplete?' });
  await confirm.getByRole('button', { name: 'Mark Incomplete' }).click();
  await confirm.waitFor({ state: 'hidden' });
  await page.waitForTimeout(2500);
};
