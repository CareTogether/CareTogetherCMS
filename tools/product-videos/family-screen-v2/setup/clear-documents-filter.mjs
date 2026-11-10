// Clears the remembered Documents quick filter, then lists the Doe family's documents.
// Run on the Doe family: node record.mjs probe family-screen-v2 /families/11111111-1111-1111-1111-111111111111 <this file>
export default async (page) => {
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) if (/familyDocuments/i.test(key)) localStorage.removeItem(key);
  });
  await page.reload();
  await page.getByRole('tab', { name: /Documents/i }).click();
  await page.waitForTimeout(1500);
};
