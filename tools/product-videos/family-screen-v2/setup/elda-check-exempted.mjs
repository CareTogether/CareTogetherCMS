// Recreates video 3's setup: exempts Elda's Comprehensive Background Check until 11/11/2026.
// Run on the Brambleswift family: node record.mjs probe family-screen-v2 /families/3ec519ec-a262-4047-b8ef-5ad8c00a2495 <this file>
export default async (page) => {
  await page.getByRole('tab', { name: /Approvals/i }).click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /^Family Host Family/ }).click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /^Missing Comprehensive Background Check/ }).nth(1).click();
  const details = page.getByRole('dialog').filter({ hasText: 'Applies To' });
  await details.waitFor();
  const appliesTo = await details.getByText(/Brambleswift$/).first().textContent();
  console.log('APPLIES TO:', appliesTo);
  if (!appliesTo.includes('Elda')) throw new Error('Not Elda');
  await details.getByRole('button', { name: 'Exempt', exact: true }).click();
  const form = page.getByRole('dialog').filter({ hasText: 'Requirement Management' });
  await form.getByRole('textbox', { name: 'Reason' }).fill('Previous background check still valid; updated comprehensive check is in progress.');
  await form.getByRole('spinbutton', { name: 'Month' }).click();
  await page.keyboard.type('11112026');
  await form.getByRole('button', { name: 'Exempt', exact: true }).click();
  await form.waitFor({ state: 'hidden' });
  await page.waitForTimeout(2000);
};
