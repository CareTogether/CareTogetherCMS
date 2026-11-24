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

async function prepareReferral(
  page: Page,
  options: { canEdit?: boolean; status?: V1ReferralStatus } = {}
) {
  const commands: unknown[] = [];
  const record: ReferralRecord = {
    ...referralRecord,
    referral: {
      ...referralRecord.referral,
      referral: {
        ...referralRecord.referral.referral,
        status: options.status ?? referralRecord.referral.referral.status,
      },
      userPermissions:
        options.canEdit === false
          ? []
          : referralRecord.referral.userPermissions,
    },
  };

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
        .concat(record),
    });
  });

  await page.route('**/Records/atomicRecordsCommand', async (route) => {
    commands.push(route.request().postDataJSON());
    await route.fulfill({ json: [record] });
  });

  await page.goto(`${ATLANTIS_ROUTE}referrals`);

  return {
    commands,
    referral: record.referral.referral,
  };
}

test.describe('edit referral drawer @pr', () => {
  for (const canEdit of [true, false]) {
    for (const status of [V1ReferralStatus.Open, V1ReferralStatus.Closed]) {
      test(`quick actions with edit=${canEdit}, status=${status}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: 390, height: 900 });
        const { referral, commands } = await prepareReferral(page, {
          canEdit,
          status,
        });
        await page.goto(`${ATLANTIS_ROUTE}referrals/${referral.referralId}`);
        await expect(
          page.getByText(referral.title, { exact: true })
        ).toBeVisible();
        const dock = page.getByRole('toolbar', {
          name: 'Referral quick actions',
          exact: true,
        });
        await expect(dock).toHaveCount(canEdit ? 1 : 0);
        const note = dock.getByRole('button', {
          name: 'Add Note',
          exact: true,
        });
        const upload = dock.getByRole('button', {
          name: 'Upload Document',
          exact: true,
        });
        await expect(note).toHaveCount(canEdit ? 1 : 0);
        await expect(upload).toHaveCount(
          canEdit && status !== V1ReferralStatus.Closed ? 1 : 0
        );
        if (canEdit) {
          const centered = await dock.evaluate((element) => {
            const style = getComputedStyle(element),
              rect = element.getBoundingClientRect();
            const buttons = Array.from(element.querySelectorAll('button')).map(
              (button) => button.getBoundingClientRect()
            );
            return (
              Math.abs(
                (rect.left +
                  Number.parseFloat(style.paddingLeft) +
                  rect.right -
                  Number.parseFloat(style.paddingRight)) /
                  2 -
                  (buttons[0].left + buttons[buttons.length - 1].right) / 2
              ) <= 1
            );
          });
          expect(centered).toBe(true);
          await note.focus();
          await note.press('Enter');
          await expect(
            page.getByRole('heading', {
              name: 'Add referral note',
              exact: true,
            })
          ).toBeVisible();
          await page
            .getByRole('button', { name: 'Cancel', exact: true })
            .click();
          await expect(note).toBeFocused();
          if (status !== V1ReferralStatus.Closed) {
            await upload.focus();
            await upload.press('Space');
            await expect(
              page.getByRole('heading', {
                name: 'Upload Referral Document',
                exact: true,
              })
            ).toBeVisible();
            await page
              .getByRole('button', { name: 'Cancel', exact: true })
              .click();
            await expect(upload).toBeFocused();
          }
        }
        expect(commands).toEqual([]);
      });
    }
  }

  for (const width of [
    320, 390, 600, 768, 899, 900, 1024, 1100, 1199, 1200, 1280, 1366, 1440,
  ]) {
    test(`responsive referral actions at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const { referral } = await prepareReferral(page);
      await page.goto(`${ATLANTIS_ROUTE}referrals/${referral.referralId}`);
      await expect(
        page.getByText(referral.title, { exact: true })
      ).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBeLessThanOrEqual(width);
      const trigger = page.getByRole('button', {
        name: 'referral actions',
        exact: true,
      });
      const dock = page.getByRole('toolbar', {
        name: 'Referral quick actions',
        exact: true,
      });
      if (width >= 1200) {
        await expect(dock).toHaveCount(0);
        await expect(
          page.getByRole('button', { name: 'Note', exact: true })
        ).toHaveCount(1);
        await expect(
          page.getByRole('button', { name: 'Upload', exact: true })
        ).toHaveCount(1);
        await expect(trigger).toHaveCount(0);
        await expect(
          page.getByRole('button', { name: 'Edit Referral', exact: true })
        ).toBeVisible();
        const actions = page
          .getByRole('button', { name: 'Edit Referral', exact: true })
          .locator('..');
        const dimensions = await actions.evaluate((element) => ({
          client: element.clientWidth,
          scroll: element.scrollWidth,
          buttons: Array.from(element.querySelectorAll('button')).map(
            (button) => ({
              whiteSpace: getComputedStyle(button).whiteSpace,
              height: button.getBoundingClientRect().height,
              lineHeight: Number.parseFloat(
                getComputedStyle(button).lineHeight
              ),
            })
          ),
        }));
        expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client);
        for (const button of dimensions.buttons) {
          expect(button.whiteSpace).toBe('nowrap');
          expect(button.height).toBeLessThan(button.lineHeight * 2);
        }
        return;
      }
      await expect(dock.getByRole('button')).toHaveCount(2);
      const alignment = await dock.evaluate((element) => {
        const style = getComputedStyle(element),
          rect = element.getBoundingClientRect();
        const buttons = Array.from(element.querySelectorAll('button')).map(
          (button) => button.getBoundingClientRect()
        );
        return {
          center:
            (rect.left +
              Number.parseFloat(style.paddingLeft) +
              rect.right -
              Number.parseFloat(style.paddingRight)) /
            2,
          group: (buttons[0].left + buttons[1].right) / 2,
          heights: buttons.map((button) => button.height),
        };
      });
      expect(Math.abs(alignment.center - alignment.group)).toBeLessThanOrEqual(
        1
      );
      alignment.heights.forEach((height) =>
        expect(height).toBeGreaterThanOrEqual(48)
      );
      for (const scroll of [0, 400, 100000]) {
        await page.evaluate((y) => scrollTo(0, y), scroll);
        await expect(dock).toBeInViewport();
        const geometry = (await dock.boundingBox())!;
        expect(geometry.height).toBe(57);
        const navigation =
          width < 900
            ? await page
                .getByRole('button', {
                  name: 'Open navigation menu',
                  exact: true,
                })
                .locator('..')
                .boundingBox()
            : null;
        expect(
          Math.abs(geometry.y + geometry.height - (navigation?.y ?? 900))
        ).toBeLessThanOrEqual(1);
      }
      expect((await dock.locator('..').boundingBox())!.y).toBeLessThanOrEqual(
        (await dock.boundingBox())!.y
      );
      if (width >= 900) {
        const expand = page
          .getByRole('banner')
          .getByRole('button', { name: 'Expand sidebar', exact: true });
        if (await expand.isVisible()) await expand.click();
        expect((await dock.boundingBox())!.x).toBe(190);
        await page
          .getByRole('banner')
          .getByRole('button', { name: 'Collapse sidebar', exact: true })
          .click();
        expect((await dock.boundingBox())!.x).toBe(48);
        await expand.click();
      }
      await trigger.focus();
      await trigger.press('Enter');
      const menu = page.locator('#referral-actions-menu');
      const backdrop = menu.locator('.MuiBackdrop-root');
      await expect(backdrop).toHaveCSS(
        'background-color',
        width < 1200 ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)'
      );
      const items = menu.getByRole('menuitem');
      await expect(
        menu.getByRole('menuitem', { name: 'Add Note', exact: true })
      ).toHaveCount(0);
      await expect(
        menu.getByRole('menuitem', { name: 'Upload', exact: true })
      ).toHaveCount(0);
      await expect(items.first()).toBeFocused();
      await items.first().press('ArrowDown');
      await expect(items.nth(1)).toBeFocused();
      if (width < 1200) {
        for (const item of await items.all()) {
          expect((await item.boundingBox())!.height).toBeGreaterThanOrEqual(48);
        }
      }
      await page.keyboard.press('Escape');
      await expect(menu).toBeHidden();
      await expect(trigger).toBeFocused();
      await trigger.click();
      await backdrop.click({ position: { x: 1, y: 1 } });
      await expect(menu).toBeHidden();
      await expect(trigger).toBeFocused();
      await trigger.click();
      await page.setViewportSize({ width: 1200, height: 900 });
      await expect(menu).toBeHidden();
      await page.setViewportSize({ width, height: 900 });
      await expect(menu).toBeHidden();
      await trigger.click();
      await menu
        .getByRole('menuitem', { name: 'Edit Referral', exact: true })
        .click();
      await expect(
        page.getByRole('heading', { name: 'Edit Referral', exact: true })
      ).toBeVisible();
      await expect(menu).toBeHidden();
      await expect(
        page.getByRole('textbox', { name: 'Referral Title' })
      ).toBeEditable();
    });
  }

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
