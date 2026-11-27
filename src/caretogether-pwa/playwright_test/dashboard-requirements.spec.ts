import { expect, test } from './support/fixtures';
import {
  ATLANTIS_LOCATION_ID,
  ATLANTIS_ORGANIZATION_ID,
  ATLANTIS_ROUTE,
  EL_DORADO_LOCATION_ID,
  locationRoute,
} from './support/constants';
import { expectNoHorizontalOverflow } from './support/layout';
import {
  noteSnoozeToken,
  snoozeStoragePrefix,
} from '../src/Dashboard/dashboardSnoozes';
import {
  Permission,
  NoteStatus,
  V1ReferralNoteStatus,
} from '../src/GeneratedClient';

const doeId = '11111111-1111-1111-1111-111111111111';

test.use({
  timezoneId: 'Pacific/Honolulu',
  viewport: { width: 375, height: 700 },
});

test('edits, approves, and deletes family and referral notes without leaving the Dashboard @pr', async ({
  page,
}) => {
  const referralId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab';
  const timestamp = '2026-11-26T12:00:00Z';
  const familyNote = {
    id: doeId,
    contents: 'Family draft for review',
    status: NoteStatus.Draft,
    lastEditTimestampUtc: timestamp,
    createdTimestampUtc: timestamp,
  };
  const familySnoozeToken = noteSnoozeToken({
    source: 'family',
    recordId: doeId,
    id: familyNote.id,
    note: {
      createdTimestampUtc: new Date(timestamp),
      lastEditTimestampUtc: new Date(timestamp),
    },
  });
  const scopePrefix = snoozeStoragePrefix({
    userId: '',
    organizationId: ATLANTIS_ORGANIZATION_ID,
    locationId: ATLANTIS_LOCATION_ID,
  });
  const scopeStart = scopePrefix.indexOf('[');
  const scopeSuffix = scopePrefix.slice(scopePrefix.indexOf(','));
  async function storedFamilySnoozes() {
    return page.evaluate(
      ({ prefix, suffix }) =>
        Object.keys(localStorage)
          .filter((key) => key.startsWith(prefix) && key.endsWith(suffix))
          .map((key) => ({ key, wakeAt: Number(localStorage.getItem(key)) })),
      {
        prefix: scopePrefix.slice(0, scopeStart) + '["',
        suffix: scopeSuffix + familySnoozeToken,
      }
    );
  }
  const referralNote = {
    id: referralId,
    referralId,
    contents: 'Referral draft for review',
    status: V1ReferralNoteStatus.Draft,
    lastEditTimestampUtc: timestamp,
    createdTimestampUtc: timestamp,
  };
  const familyDiscard = {
    ...familyNote,
    id: referralId,
    contents: 'Family draft to delete',
  };
  const referralDiscard = {
    ...referralNote,
    id: doeId,
    contents: 'Referral draft to delete',
  };
  const familyNotes = [familyNote, familyDiscard];
  const referralNotes = [referralNote, referralDiscard];
  const referralAggregate = {
    discriminator: 'ReferralRecordsAggregate',
    id: referralId,
    referral: {
      userPermissions: [Permission.ViewV1Referral, Permission.EditV1Referral],
      referral: {
        referralId,
        familyId: doeId,
        title: 'Review intake',
        createdAtUtc: timestamp,
        notes: referralNotes,
      },
    },
  };
  let familyAggregate: object;
  await page.route('**/Records', async (route) => {
    const response = await route.fetch();
    const records = (await response.json()) as Array<{
      id: string;
      family?: { notes?: object[]; userPermissions: Permission[] };
    }>;
    for (const record of records) {
      if (!record.family) continue;
      record.family.notes = record.id === doeId ? familyNotes : [];
      if (record.id !== doeId) continue;
      record.family.userPermissions.push(
        Permission.ApproveNotes,
        Permission.AddEditDraftNotes,
        Permission.DiscardDraftNotes
      );
      familyAggregate = record;
    }
    await route.fulfill({ response, json: [...records, referralAggregate] });
  });
  const started = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  let familyApprovalRequests = 0;
  await page.route('**/Records/atomicRecordsCommand', async (route) => {
    const { command } = route.request().postDataJSON();
    switch (command.discriminator) {
      case 'EditDraftNote':
        familyNote.contents = command.draftNoteContents;
        break;
      case 'EditV1ReferralDraftNote':
        referralNote.contents = command.draftNoteContents;
        break;
      case 'ApproveNote':
        familyApprovalRequests++;
        started.resolve();
        await release.promise;
        familyNote.status = NoteStatus.Approved;
        break;
      case 'ApproveV1ReferralNote':
        referralNote.status = V1ReferralNoteStatus.Approved;
        break;
      case 'DiscardDraftNote':
        expect(command.noteId).toBe(familyDiscard.id);
        familyNotes.pop();
        break;
      case 'DiscardV1ReferralDraftNote':
        expect(command.noteId).toBe(referralDiscard.id);
        referralNotes.pop();
        break;
      default:
        await route.fallback();
        return;
    }
    await route.fulfill({
      json: [command.referralId ? referralAggregate : familyAggregate],
    });
  });
  await page.clock.install();
  await page.goto(ATLANTIS_ROUTE);
  const panel = page
    .locator('section')
    .filter({ has: page.getByText('Notes awaiting review', { exact: true }) });
  const row = (contents: string) =>
    panel.getByRole('listitem').filter({ hasText: contents });
  const noteCount = (count: number) =>
    panel.getByLabel(`${count} ${count === 1 ? 'note' : 'notes'}`, {
      exact: true,
    });
  await expect(noteCount(4)).toBeVisible();
  expect(await storedFamilySnoozes()).toHaveLength(0);
  await expect(
    panel.getByRole('button', { name: 'All notes (4)' })
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    panel.getByRole('button', { name: 'Families (2)' })
  ).toBeVisible();
  await expect(
    panel.getByRole('button', { name: 'Referrals (2)' })
  ).toBeVisible();
  await row(familyNote.contents)
    .getByRole('button', { name: /Family draft for review/ })
    .click();
  await expect(page).toHaveURL(
    (url) =>
      url.pathname.endsWith(`/families/${doeId}`) &&
      url.searchParams.get('section') === 'notes'
  );
  await page.goBack();
  const familySnooze = row(familyNote.contents).getByRole('button', {
    name: 'Snooze note',
  });
  await familySnooze.click();
  const snoozeDrawer = page.getByRole('dialog', { name: 'Snooze until' });
  await expect(snoozeDrawer.getByRole('radio')).toHaveCount(4);
  await snoozeDrawer.getByRole('button', { name: 'Cancel' }).click();
  await expect(familySnooze).toBeFocused();
  await familySnooze.press('Enter');
  await snoozeDrawer
    .getByRole('button', { name: 'Snooze', exact: true })
    .click();
  await expect(row(familyNote.contents)).toHaveCount(0);
  await expect(page).toHaveURL(ATLANTIS_ROUTE);
  await expect(noteCount(3)).toBeVisible();
  const persisted = await storedFamilySnoozes();
  expect(persisted).toHaveLength(1);
  expect(persisted[0].wakeAt).toBeGreaterThan(
    await page.evaluate(() => Date.now())
  );
  await page.reload();
  await expect(noteCount(3)).toBeVisible();
  await expect(row(familyNote.contents)).toHaveCount(0);
  await panel.getByRole('button', { name: 'Show snoozed (1)' }).click();
  await expect(row(familyNote.contents).locator('time')).toBeVisible();
  await row(familyNote.contents)
    .getByRole('button', { name: 'Unsnooze note', exact: true })
    .click();
  await expect(noteCount(4)).toBeVisible();
  expect(await storedFamilySnoozes()).toHaveLength(0);
  await expect(
    panel.getByRole('button', { name: 'All notes (4)' })
  ).toHaveAttribute('aria-pressed', 'true');
  const restoredFeedback = page.getByText(
    'Note returned to the review queue.',
    { exact: true }
  );
  await expect(restoredFeedback).toBeVisible();
  await familySnooze.click();
  await expect(restoredFeedback).toHaveCount(0);
  await snoozeDrawer
    .getByRole('button', { name: 'Snooze', exact: true })
    .click();
  await expect(familySnooze).toHaveCount(0);
  await expect(noteCount(3)).toBeVisible();
  await expect(row(familyNote.contents)).toHaveCount(0);
  const resnoozed = await storedFamilySnoozes();
  expect(resnoozed.map(({ key }) => key)).toEqual([persisted[0].key]);
  await page.evaluate((key) => {
    const newValue = JSON.stringify(Date.now() + 1000);
    localStorage.setItem(key, newValue);
    window.dispatchEvent(new StorageEvent('storage', { key, newValue }));
  }, persisted[0].key);
  await page.clock.fastForward(1000);
  await expect(familySnooze).toBeVisible();
  await expect(noteCount(4)).toBeVisible();
  await row(familyNote.contents).getByRole('button', { name: 'Edit' }).click();
  await page
    .getByRole('textbox', { name: 'Notes', exact: true })
    .fill('Edited family draft');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(row('Edited family draft')).toBeVisible();
  await row(referralNote.contents)
    .getByRole('button', { name: 'Edit' })
    .click();
  await page
    .getByRole('textbox', { name: 'Note', exact: true })
    .fill('Edited referral draft');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(row('Edited referral draft')).toBeVisible();
  await expect(page).toHaveURL(ATLANTIS_ROUTE);

  await row('Edited family draft')
    .getByRole('button', { name: 'Approve', exact: true })
    .click();
  const familyDialog = page.getByRole('dialog', {
    name: /approve and finalize/,
  });
  const confirm = familyDialog.getByRole('button', {
    name: 'Approve',
    exact: true,
  });
  try {
    await confirm.evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });
    await started.promise;
    await expect(confirm).toBeDisabled();
    await expect(panel.getByText('Edited family draft')).toHaveCount(1);
  } finally {
    release.resolve();
  }
  await expect(row('Edited family draft')).toHaveCount(0);
  await expect(noteCount(3)).toBeVisible();
  expect(familyApprovalRequests).toBe(1);
  await row('Edited referral draft')
    .getByRole('button', { name: 'Approve', exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Approve', exact: true })
    .click();
  await expect(noteCount(2)).toBeVisible();
  const familyDelete = row(familyDiscard.contents).getByRole('button', {
    name: 'Delete',
    exact: true,
  });
  const dialog = page.getByRole('dialog');
  await familyDelete.press('Enter');
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(familyDelete).toBeVisible();
  await expect(noteCount(2)).toBeVisible();
  await familyDelete.click();
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(row(familyDiscard.contents)).toHaveCount(0);
  await expect(noteCount(1)).toBeVisible();
  await row(referralDiscard.contents)
    .getByRole('button', { name: 'Delete', exact: true })
    .click();
  await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(row(referralDiscard.contents)).toHaveCount(0);
  await expect(panel.getByText('No notes awaiting review.')).toBeVisible();
  await expect(noteCount(0)).toBeVisible();
  await expect(page).toHaveURL(ATLANTIS_ROUTE);
});

test('Dashboard shows scoped requirement counts and opens the arrangement @pr', async ({
  page,
}) => {
  const loading = Promise.withResolvers<void>();
  let target: { v1CaseId: string; arrangementId: string } | undefined;
  const dueBy = new Date();
  dueBy.setUTCDate(dueBy.getUTCDate() + 10);
  type WireCase = {
    id: string;
    arrangements?: { id: string; missingRequirements?: unknown[] }[];
  };
  await page.route('**/Records', async (route) => {
    await loading.promise;
    const response = await route.fetch();
    const records = (await response.json()) as Array<{
      id: string;
      family?: {
        partneringFamilyInfo?: {
          openV1Case?: WireCase;
          closedV1Cases?: WireCase[];
        };
      };
    }>;
    const isAtlantis = new URL(route.request().url()).pathname.includes(
      `/${ATLANTIS_LOCATION_ID}/`
    );
    let injected = false;
    for (const record of records) {
      const partnering = record.family?.partneringFamilyInfo;
      const cases = [...(partnering?.closedV1Cases ?? [])];
      if (partnering?.openV1Case) cases.push(partnering.openV1Case);
      for (const v1Case of cases) {
        for (const arrangement of v1Case.arrangements ?? []) {
          arrangement.missingRequirements = [];
          if (
            !isAtlantis ||
            record.id !== doeId ||
            v1Case.id !== doeId ||
            arrangement.id !== doeId
          ) {
            continue;
          }
          target = { v1CaseId: v1Case.id, arrangementId: arrangement.id };
          injected = true;
          const imminent = {
            action: { actionName: 'Upcoming safety visit', isRequired: true },
            dueBy: dueBy.toISOString().slice(0, 10),
          };
          arrangement.missingRequirements = [
            imminent,
            imminent,
            {
              action: {
                actionName: 'Outstanding safety visit',
                isRequired: true,
              },
              pastDueSince: '2020-02-29',
            },
          ];
        }
      }
    }
    if (isAtlantis)
      expect(injected, 'Seeded Doe case and arrangement').toBe(true);
    await route.fulfill({ response, json: records });
  });

  const recordsRequested = page.waitForRequest('**/Records');
  try {
    await page.goto(ATLANTIS_ROUTE, { waitUntil: 'domcontentloaded' });
    await recordsRequested;
    await expect(
      page
        .getByText(/^(Initializing\.\.\.|Loading\.\.\.|Loading requirements…)$/)
        .first()
    ).toBeVisible();
    await expect(page.getByText('No past-due requirements.')).toHaveCount(0);
  } finally {
    loading.resolve();
  }

  const upcoming = page.getByRole('region', { name: 'Upcoming requirements' });
  const pastDue = page.getByRole('region', { name: 'Past-due requirements' });
  await expect(upcoming.getByLabel('2 requirements')).toBeVisible();
  await expect(pastDue.getByLabel('1 requirement')).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect
    .poll(async () => {
      const [left, right] = await Promise.all(
        [pastDue, upcoming].map((panel) => panel.boundingBox())
      );
      return left && right ? Math.round(left.y - right.y) : null;
    })
    .toBe(0);
  await page.setViewportSize({ width: 375, height: 700 });
  const action = upcoming.getByRole('button', {
    name: /^(?!Snooze).*Upcoming safety visit/,
  });
  await expect(action).toHaveCount(1);
  await expect(action).toContainText('2 matching requirements');
  await expect(
    upcoming.getByRole('button', { name: 'Snooze Upcoming safety visit' })
  ).toHaveCount(1);
  await expect(pastDue.getByText('02/29/20')).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await action.focus();
  await action.press('Enter');
  expect(target).toBeDefined();
  await expect(page).toHaveURL(
    (url) =>
      url.pathname.endsWith(`/families/${doeId}`) &&
      url.searchParams.get('v1CaseId') === target?.v1CaseId &&
      url.searchParams.get('arrangementId') === target?.arrangementId &&
      url.searchParams
        .get('arrangementRequirement')
        ?.includes('Upcoming safety visit') === true
  );
  await expect(
    page.getByRole('button', { name: 'close arrangement details' })
  ).toBeVisible();
  await expect(
    page.getByText('Dashboard selection', { exact: true })
  ).toHaveCount(0);

  await page.goBack();
  await expect(upcoming.getByLabel('2 requirements')).toBeVisible();
  await page.goForward();
  await expect(
    page.getByRole('button', { name: 'close arrangement details' })
  ).toBeVisible();
  await page.goBack();
  await pastDue
    .getByRole('button', { name: /^(?!Snooze).*Outstanding safety visit/ })
    .click();
  await expect(
    page.getByText('Dashboard selection', { exact: true })
  ).toBeVisible();
  await page.goBack();
  await expect(upcoming.getByLabel('2 requirements')).toBeVisible();

  const calendarPreferences = {
    'caretogether:dashboardCalendarView': 'agenda',
    'caretogether:dashboardCalendarEventTypeFilters': '[]',
  };
  await page.evaluate((preferences) => {
    for (const [key, value] of Object.entries(preferences)) {
      localStorage.setItem(key, value);
    }
  }, calendarPreferences);

  const upcomingTimeFrame = upcoming.getByRole('combobox', {
    name: 'Upcoming requirements time frame',
  });
  const pastDueTimeFrame = pastDue.getByRole('combobox', {
    name: 'Past-due requirements time frame',
  });
  await upcomingTimeFrame.click();
  await page.getByRole('option', { name: 'Next 7 days', exact: true }).click();
  await expect(upcoming.getByLabel('0 requirements')).toBeVisible();
  await expect(upcomingTimeFrame).toHaveText('Next 7 days');
  await expect(pastDueTimeFrame).toHaveText('All past due');
  await pastDueTimeFrame.click();
  await page.getByRole('option', { name: 'Last 7 days', exact: true }).click();
  await expect(upcomingTimeFrame).toHaveText('Next 7 days');
  await expect(
    pastDue.getByText('1 older unresolved requirement outside this window.')
  ).toBeVisible();
  await expect(pastDue.getByLabel('0 requirements')).toBeVisible();

  await page.reload();
  await expect(upcomingTimeFrame).toHaveText('Next 7 days');
  await expect(pastDueTimeFrame).toHaveText('Last 7 days');
  await pastDue.getByRole('button', { name: 'Show all' }).click();
  await expect(pastDue.getByLabel('1 requirement')).toBeVisible();
  await expect(pastDueTimeFrame).toHaveText('All past due');
  await expect(pastDue.getByRole('button', { name: 'Show all' })).toHaveCount(
    0
  );
  await pastDueTimeFrame.click();
  await page.getByRole('option', { name: 'Last 7 days', exact: true }).click();

  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await page.getByRole('combobox', { name: 'Location', exact: true }).click();
  await page.getByRole('option', { name: 'El Dorado', exact: true }).click();
  await expect(page).toHaveURL(
    locationRoute(ATLANTIS_ORGANIZATION_ID, EL_DORADO_LOCATION_ID)
  );
  await page.keyboard.press('Escape');
  await expect(
    upcoming.getByText('No upcoming requirements in the next 30 days.')
  ).toBeVisible();
  await expect(pastDue.getByText('No past-due requirements.')).toBeVisible();
  await expect(upcomingTimeFrame).toHaveText('Next 30 days');
  await expect(pastDueTimeFrame).toHaveText('All past due');
  await page.goBack();
  await expect(upcomingTimeFrame).toHaveText('Next 7 days');
  await expect(pastDueTimeFrame).toHaveText('Last 7 days');
  expect(
    await page.evaluate(
      (keys) =>
        Object.fromEntries(keys.map((key) => [key, localStorage.getItem(key)])),
      Object.keys(calendarPreferences)
    )
  ).toEqual(calendarPreferences);
});
