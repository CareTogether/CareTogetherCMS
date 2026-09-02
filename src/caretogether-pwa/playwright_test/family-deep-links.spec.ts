import { expect, test } from './support/fixtures';
import { ATLANTIS_ROUTE } from './support/constants';

const SKYWALKER_FAMILY_ID = '22222222-2222-2222-2222-222222222222';
const BEN_SOLO_PERSON_ID = '77777777-7777-7777-7777-777777777777';
const DOE_FAMILY_ID = '11111111-1111-1111-1111-111111111111';
const DOE_V1_CASE_ID = '11111111-1111-1111-1111-111111111111';
const DOE_ARRANGEMENT_ID = '11111111-1111-1111-1111-111111111111';

function familyRoute(familyId: string, searchParams?: URLSearchParams) {
  const search = searchParams?.size ? `?${searchParams.toString()}` : '';
  return `${ATLANTIS_ROUTE}families/${familyId}${search}`;
}

test.describe('family deep links @pr', () => {
  test('opens and closes the family member drawer from familyMemberId', async ({
    page,
  }) => {
    const searchParams = new URLSearchParams({
      familyMemberId: BEN_SOLO_PERSON_ID,
      source: 'playwright',
    });

    await page.goto(familyRoute(SKYWALKER_FAMILY_ID, searchParams));

    await expect(
      page.getByRole('heading', { name: 'Ben Solo' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Close family member drawer' })
    ).toBeVisible();

    await page
      .getByRole('button', { name: 'Close family member drawer' })
      .click();

    await expect(
      page.getByRole('heading', { name: 'Ben Solo' })
    ).toHaveCount(0);
    await expect(page).toHaveURL(/source=playwright/);
    await expect(page).not.toHaveURL(/familyMemberId=/);
  });

  test('ignores an invalid familyMemberId', async ({ page }) => {
    const searchParams = new URLSearchParams({
      familyMemberId: 'not-a-real-person',
    });

    await page.goto(familyRoute(SKYWALKER_FAMILY_ID, searchParams));

    await expect(
      page.getByRole('button', { name: 'Close family member drawer' })
    ).toHaveCount(0);
  });

  test('opens and closes the arrangement drawer from arrangementId', async ({
    page,
  }) => {
    const searchParams = new URLSearchParams({
      v1CaseId: DOE_V1_CASE_ID,
      arrangementId: DOE_ARRANGEMENT_ID,
    });

    await page.goto(familyRoute(DOE_FAMILY_ID, searchParams));

    await expect(
      page.getByRole('button', { name: 'close arrangement details' })
    ).toBeVisible();

    await page.getByRole('button', { name: 'close arrangement details' }).click();

    await expect(
      page.getByRole('button', { name: 'close arrangement details' })
    ).toHaveCount(0);
    await expect(page).toHaveURL(/v1CaseId=/);
    await expect(page).not.toHaveURL(/arrangementId=/);
  });

  test('opens the arrangement drawer from a Dashboard calendar item', async ({
    page,
  }) => {
    await page.goto(ATLANTIS_ROUTE);

    await page.getByRole('button', { name: /previous/i }).click();
    await page.getByText('Eric Doe - Family Coach Safety Visit').click();

    await expect(page).toHaveURL(new RegExp(`v1CaseId=${DOE_V1_CASE_ID}`));
    await expect(page).toHaveURL(
      new RegExp(`arrangementId=${DOE_ARRANGEMENT_ID}`)
    );
    await expect(
      page.getByRole('button', { name: 'close arrangement details' })
    ).toBeVisible();
  });
});
