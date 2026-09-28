import type { Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { ATLANTIS_ROUTE } from './support/constants';
import {
  CustomFieldType,
  CustomFieldValidation,
  Permission,
  V1ReferralStatus,
} from '../src/GeneratedClient';

const referralSourceField = 'Referral Source';
const referralSourceValue = 'Asgard';
const referralId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

type ReferralRecord = {
  discriminator: string;
  id: string;
  referral: {
    referral: {
      referralId: string;
      status: V1ReferralStatus;
      title: string;
      completedCustomFields: Record<string, unknown>;
    };
    userPermissions: Permission[];
  };
};

const referralRecord: ReferralRecord = {
  discriminator: 'ReferralRecordsAggregate',
  id: referralId,
  referral: {
    referral: {
      referralId,
      createdAtUtc: new Date().toISOString(),
      title: 'Referral edit test',
      status: V1ReferralStatus.Open,
      completedCustomFields: {
        [referralSourceField]: {
          userId: '11111111-1111-1111-1111-111111111111',
          timestampUtc: new Date().toISOString(),
          completedCustomFieldId: '22222222-2222-2222-2222-222222222222',
          customFieldName: referralSourceField,
          customFieldType: CustomFieldType.String,
          value: referralSourceValue,
        },
      },
      completedRequirements: [],
      exemptedRequirements: [],
      uploadedDocuments: [],
      deletedDocuments: [],
      assignedIndividualVolunteers: [],
      history: [],
      notes: [],
      missingIntakeRequirements: [],
    },
    userPermissions: [Permission.EditV1Referral],
  },
};

async function prepareReferral(page: Page) {
  const commands: unknown[] = [];

  await page.route('**/Configuration/policy', async (route) => {
    const response = await route.fetch();
    const policy = await response.json();
    const customFields = policy.referralPolicy.customFields as Array<{
      name: string;
    }>;

    policy.referralPolicy.customFields = customFields
      .filter(({ name }) => name !== referralSourceField)
      .concat({
        name: referralSourceField,
        type: CustomFieldType.String,
        validation: CustomFieldValidation.SuggestOnly,
        validValues: [referralSourceValue, 'Midgard'],
      });

    await route.fulfill({ response, json: policy });
  });

  await page.route('**/Records', async (route) => {
    const response = await route.fetch();
    const records = (await response.json()) as ReferralRecord[];
    await route.fulfill({
      response,
      json: records
        .filter((record) => record.id !== referralRecord.id)
        .concat(referralRecord),
    });
  });

  await page.route('**/Records/atomicRecordsCommand', async (route) => {
    commands.push(route.request().postDataJSON());
    await route.fulfill({ json: [referralRecord] });
  });

  await page.goto(`${ATLANTIS_ROUTE}referrals`);

  return {
    commands,
    referral: referralRecord.referral.referral,
  };
}

test.describe('edit referral drawer @pr', () => {
  test('loads saved custom fields and submits only changed data', async ({
    page,
  }) => {
    const { commands, referral } = await prepareReferral(page);
    await page.goto(`${ATLANTIS_ROUTE}referrals/${referral.referralId}`);

    await page.getByRole('button', { name: 'Edit Referral' }).click();
    const referralSource = page.getByRole('combobox').last();
    await expect(referralSource).toHaveValue(referralSourceValue);

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(
      page.getByRole('heading', { name: 'Edit Referral' })
    ).toBeHidden();
    expect(commands).toEqual([]);

    await page.getByRole('button', { name: 'Edit Referral' }).click();
    await page
      .getByRole('textbox', { name: 'Referral Title' })
      .fill(`${referral.title} updated`);
    await page.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => commands.length).toBe(1);
    expect(commands[0]).toMatchObject({
      discriminator: 'V1ReferralRecordsCommand',
      command: {
        discriminator: 'UpdateV1ReferralDetails',
        referralId: referral.referralId,
      },
    });
  });
});
