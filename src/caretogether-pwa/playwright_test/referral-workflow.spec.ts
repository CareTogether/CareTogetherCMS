import { expect, test } from './support/fixtures';
import { openAtlantisHome, sideNavigation } from './support/navigation';
import {
  createClientFamilyForReferral,
  createReferral,
  openCaseForReferral,
  openReferralsFromSideNavigation,
} from './support/referrals';

test.describe('referral workflow @workflow @pr', () => {
  test('creates a referral, client family and case, then resolves a missing child DOB', async ({
    page,
  }) => {
    test.setTimeout(180_000);

    const timestamp = Date.now();
    const referralTitle = `Playwright Referral ${timestamp}`;
    const referralComment = `Created by Playwright referral workflow ${timestamp}`;
    const adultFirstName = 'Playwright';
    const adultLastName = `Client ${timestamp}`;

    await openAtlantisHome(page);
    await openReferralsFromSideNavigation(page);
    await createReferral(page, {
      title: referralTitle,
      comment: referralComment,
    });
    const familyName = await createClientFamilyForReferral(page, {
      firstName: adultFirstName,
      lastName: adultLastName,
    });
    await openCaseForReferral(page);

    await page
      .getByRole('button', { name: `${familyName} Family`, exact: true })
      .click();
    await page.getByRole('button', { name: 'Child', exact: true }).click();
    const addChildTitle = page.getByRole('heading', { name: /^Add Child to / });
    await expect(addChildTitle).toBeVisible();
    await page.getByLabel(/first name/i).fill('Child');
    await page.getByLabel(/last name/i).fill(adultLastName);

    const saveChild = page.getByRole('button', {
      name: 'Add to Family',
      exact: true,
    });
    await expect(saveChild).toBeEnabled();
    const picker = page.getByRole('group', {
      name: /Date of birth/,
    });
    await picker
      .getByRole('spinbutton', { name: 'Month', exact: true })
      .fill('02');
    await saveChild.click({ force: true });
    await expect(saveChild).toBeDisabled();
    await expect(addChildTitle).toBeVisible();

    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(addChildTitle).toHaveCount(0);
    await page.getByRole('button', { name: 'Child', exact: true }).click();
    await page.getByLabel(/first name/i).fill('Child');
    await page.getByLabel(/last name/i).fill(adultLastName);
    await saveChild.click();
    await expect(addChildTitle).toHaveCount(0);
    await page.reload();

    await sideNavigation(page).getByRole('button', { name: /inbox/i }).click();
    const warning = page.getByRole('button').filter({
      hasText: `Missing child date of birth: Child ${adultLastName}`,
    });
    await expect(warning).toHaveCount(1);
    await warning.click();
    await expect(page).toHaveURL(/familyMemberId=/);
    await expect(
      page.getByRole('heading', { name: `Child ${adultLastName}`, exact: true })
    ).toBeVisible();

    await page
      .getByText(/^Age:/)
      .getByRole('button', { name: 'Edit', exact: true })
      .click();
    await picker
      .getByRole('spinbutton', { name: 'Month', exact: true })
      .fill('01');
    await picker
      .getByRole('spinbutton', { name: 'Day', exact: true })
      .fill('02');
    await picker
      .getByRole('spinbutton', { name: 'Year', exact: true })
      .fill('2020');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page
      .getByRole('button', { name: 'Close family member drawer' })
      .click();
    await sideNavigation(page).getByRole('button', { name: /inbox/i }).click();
    await expect(warning).toHaveCount(0);
    await page.reload();
    await expect(warning).toHaveCount(0);
  });
});
