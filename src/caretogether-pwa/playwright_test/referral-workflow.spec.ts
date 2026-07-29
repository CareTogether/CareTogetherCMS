import { test } from './support/fixtures';
import { openAtlantisHome } from './support/navigation';
import {
  createClientFamilyForReferral,
  createReferral,
  openCaseForReferral,
  openReferralsFromSideNavigation,
} from './support/referrals';

test.describe('referral workflow @workflow @pr', () => {
  test('creates a referral, client family, and case', async ({ page }) => {
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
    await createClientFamilyForReferral(page, {
      firstName: adultFirstName,
      lastName: adultLastName,
    });
    await openCaseForReferral(page);
  });
});
