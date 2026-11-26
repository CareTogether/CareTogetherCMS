import { expect, test } from './support/fixtures';
import {
  ATLANTIS_LOCATION_ID,
  ATLANTIS_ORGANIZATION_ID,
  ATLANTIS_ROUTE,
  EL_DORADO_LOCATION_ID,
  locationRoute,
} from './support/constants';
import { expectNoHorizontalOverflow } from './support/layout';
import { ORGANIZATION_APPROVALS_FEATURE_FLAG } from '../src/featureFlags';
import {
  FamilyRecordsAggregate,
  ApprovalRenewalRoleScope,
  DisclosedApprovalRenewalState,
  Permission,
  NoteStatus,
  RecordsAggregate,
  RoleApprovalStatus,
  V1ReferralNoteStatus,
} from '../src/GeneratedClient';

const doeId = '11111111-1111-1111-1111-111111111111';

test.use({
  featureFlags: { [ORGANIZATION_APPROVALS_FEATURE_FLAG]: true },
  timezoneId: 'Pacific/Honolulu',
  viewport: { width: 375, height: 700 },
});

test('edits and approves family and referral notes without leaving the Dashboard @pr', async ({
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
  const referralNote = {
    id: referralId,
    referralId,
    contents: 'Referral draft for review',
    status: V1ReferralNoteStatus.Draft,
    lastEditTimestampUtc: timestamp,
    createdTimestampUtc: timestamp,
  };
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
        notes: [referralNote],
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
      record.family.notes = record.id === doeId ? [familyNote] : [];
      if (record.id !== doeId) continue;
      record.family.userPermissions.push(
        Permission.ApproveNotes,
        Permission.AddEditDraftNotes
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
      default:
        await route.fallback();
        return;
    }
    await route.fulfill({
      json: [command.referralId ? referralAggregate : familyAggregate],
    });
  });
  await page.goto(ATLANTIS_ROUTE);
  const panel = page
    .locator('section')
    .filter({ has: page.getByText('Notes awaiting review', { exact: true }) });
  const row = (contents: string) =>
    panel.getByRole('listitem').filter({ hasText: contents });
  await row(familyNote.contents)
    .getByRole('button', { name: /Family draft for review/ })
    .click();
  await expect(page).toHaveURL(
    (url) =>
      url.pathname.endsWith(`/families/${doeId}`) &&
      url.searchParams.get('section') === 'notes'
  );
  await page.goBack();
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
  expect(familyApprovalRequests).toBe(1);
  await row('Edited referral draft')
    .getByRole('button', { name: 'Approve', exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Approve', exact: true })
    .click();
  await expect(panel.getByText('No notes awaiting review.')).toBeVisible();
  await expect(page).toHaveURL(ATLANTIS_ROUTE);
});

test('Dashboard shows scoped requirement counts and opens the arrangement @pr', async ({
  page,
}) => {
  const loading = Promise.withResolvers<void>();
  let target: { v1CaseId: string; arrangementId: string } | undefined;
  await page.route('**/Records', async (route) => {
    await loading.promise;
    const response = await route.fetch();
    const records = (await response.json()).map(
      RecordsAggregate.fromJS
    ) as RecordsAggregate[];
    for (const record of records) {
      if (!(record instanceof FamilyRecordsAggregate)) continue;
      const partnering = record.family.partneringFamilyInfo;
      const cases = [...(partnering?.closedV1Cases ?? [])];
      if (partnering?.openV1Case) cases.push(partnering.openV1Case);
      for (const v1Case of cases) {
        for (const arrangement of v1Case.arrangements ?? []) {
          arrangement.missingRequirements = [];
        }
      }
      const v1Case = partnering?.openV1Case;
      const arrangement = v1Case?.arrangements?.find(({ id }) => id === doeId);
      if (record.id !== doeId || !v1Case || !arrangement) continue;

      target = { v1CaseId: v1Case.id, arrangementId: arrangement.id };
      if (!route.request().url().includes(`/${ATLANTIS_LOCATION_ID}/`))
        continue;

      const dueBy = new Date();
      dueBy.setUTCDate(dueBy.getUTCDate() + 10);
      const imminent = {
        action: { actionName: 'Upcoming safety visit', isRequired: true },
        dueBy: dueBy.toISOString().slice(0, 10),
      };
      const wireRecord = record.toJSON();
      wireRecord.family.partneringFamilyInfo.openV1Case.arrangements.find(
        ({ id }: { id: string }) => id === arrangement.id
      ).missingRequirements = [
        imminent,
        imminent,
        {
          action: { actionName: 'Outstanding safety visit', isRequired: true },
          pastDueSince: '2020-02-29',
        },
      ];
      records[records.indexOf(record)] = wireRecord;
    }
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
    await expect(
      page.getByText(
        'No approvals or renewals in the selected window, and no expired approvals or unresolved renewals.'
      )
    ).toHaveCount(0);
  } finally {
    loading.resolve();
  }

  const upcoming = page.getByRole('region', { name: 'Upcoming requirements' });
  const pastDue = page.getByRole('region', { name: 'Past-due requirements' });
  await expect(upcoming.getByLabel('2 requirements')).toBeVisible();
  await expect(pastDue.getByLabel('1 requirement')).toBeVisible();
  const action = upcoming.getByRole('button', {
    name: /Upcoming safety visit/,
  });
  await expect(action).toHaveCount(1);
  await expect(action).toContainText('2 matching requirements');
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
    .getByRole('button', { name: /Outstanding safety visit/ })
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
  const approvalTimeFrame = page.getByRole('combobox', {
    name: 'Expiring approvals and requirements time frame',
  });
  await approvalTimeFrame.click();
  await page.getByRole('option', { name: 'Next 60 days', exact: true }).click();
  await upcomingTimeFrame.click();
  await page.getByRole('option', { name: 'Next 7 days', exact: true }).click();
  await expect(upcoming.getByLabel('0 requirements')).toBeVisible();
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
  await expect(approvalTimeFrame).toHaveText('Next 30 days');
  await page.goBack();
  await expect(upcomingTimeFrame).toHaveText('Next 7 days');
  await expect(pastDueTimeFrame).toHaveText('Last 7 days');
  await expect(approvalTimeFrame).toHaveText('Next 60 days');
  expect(
    await page.evaluate(
      (keys) =>
        Object.fromEntries(keys.map((key) => [key, localStorage.getItem(key)])),
      Object.keys(calendarPreferences)
    )
  ).toEqual(calendarPreferences);
});

test('shows disclosed approvals and renewals and restores the independent UTC window @pr', async ({
  page,
}) => {
  const communityId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  let statusOnly = false;
  const now = new Date();
  now.setUTCDate(now.getUTCDate() + 12);
  const expirationDate = now.toISOString().slice(0, 10);
  now.setUTCDate(now.getUTCDate() - 1);
  const timeline = {
    ranges: [
      {
        start: '2020-01-01',
        end: now.toISOString().slice(0, 10),
        tag: RoleApprovalStatus.Approved,
      },
      {
        start: expirationDate,
        end: '9999-12-31',
        tag: RoleApprovalStatus.Expired,
      },
    ],
  };
  const role = {
    effectiveRoleApprovalStatus: timeline,
    roleVersionApprovals: [],
  };
  await page.route('**/Records', async (route) => {
    const response = await route.fetch();
    const records = (await response.json()) as Array<{
      id: string;
      family?: {
        family: { primaryFamilyContactPersonId: string };
        userPermissions: Permission[];
        volunteerFamilyInfo?: object;
      };
      community?: { approvalInfo?: object };
    }>;
    for (const record of records) {
      if (record.family) record.family.volunteerFamilyInfo = undefined;
      if (record.community) record.community.approvalInfo = undefined;
    }
    const subject = records.find(({ id }) => id === doeId)?.family;
    expect(subject).toBeTruthy();
    const family = subject!;
    family.userPermissions.push(
      Permission.ViewApprovalStatus,
      Permission.ViewApprovalProgress
    );
    if (statusOnly) {
      family.userPermissions = family.userPermissions.filter(
        (permission) => permission !== Permission.ViewApprovalProgress
      );
    }
    family.volunteerFamilyInfo = {
      familyRoleApprovals: {
        'Family Coach': role,
        'Legacy Coach': {
          ...role,
          effectiveRoleApprovalStatus: {
            ranges: [
              {
                start: '2020-01-01',
                end: '2020-01-31',
                tag: RoleApprovalStatus.Approved,
              },
              {
                start: '2020-02-01',
                end: '9999-12-31',
                tag: RoleApprovalStatus.Expired,
              },
            ],
          },
        },
      },
      individualVolunteers: {
        [family.family.primaryFamilyContactPersonId]: {
          approvalStatusByRole: { 'Individual Coach': role },
        },
      },
      renewalCandidates: [
        {
          candidateKey: 'individual-renewal',
          target: {
            discriminator: 'IndividualApprovalRenewalTarget',
            familyId: doeId,
            personId: family.family.primaryFamilyContactPersonId,
          },
          actionName: 'Safety check renewal',
          firstUncoveredOnUtc: expirationDate,
          state: DisclosedApprovalRenewalState.Upcoming,
          affectedRoles: [
            {
              scope: ApprovalRenewalRoleScope.Family,
              roleName: 'Family Coach',
            },
          ],
        },
        {
          candidateKey: 'family-renewal',
          target: {
            discriminator: 'FamilyApprovalRenewalTarget',
            familyId: doeId,
          },
          actionName: 'Household check renewal',
          firstUncoveredOnUtc: '2022-04-10',
          state: DisclosedApprovalRenewalState.Upcoming,
          affectedRoles: [
            {
              scope: ApprovalRenewalRoleScope.Family,
              roleName: 'Family Coach',
            },
          ],
        },
      ],
    };
    await route.fulfill({
      response,
      json: [
        ...records,
        {
          id: communityId,
          discriminator: 'CommunityRecordsAggregate',
          community: {
            community: { id: communityId, name: 'Community partners' },
            userPermissions: [
              Permission.ViewApprovalStatus,
              Permission.ViewApprovalProgress,
            ],
            approvalInfo: {
              approvalStatusByRole: {
                'Partner role': role,
                'Other role': {
                  ...role,
                  effectiveRoleApprovalStatus: {
                    ranges: [
                      {
                        start: '2022-04-08',
                        end: '9999-12-31',
                        tag: RoleApprovalStatus.Expired,
                      },
                    ],
                  },
                },
              },
              renewalCandidates: [
                {
                  candidateKey: 'organization-renewal',
                  target: {
                    discriminator: 'OrganizationApprovalRenewalTarget',
                    communityId,
                  },
                  actionName: 'Partner screening renewal',
                  firstUncoveredOnUtc: '2022-04-08',
                  state: DisclosedApprovalRenewalState.Uncovered,
                  affectedRoles: [
                    {
                      scope: ApprovalRenewalRoleScope.Organization,
                      roleName: 'Other role',
                    },
                  ],
                },
              ],
            },
          },
        },
      ],
    });
  });

  await page.goto(ATLANTIS_ROUTE);
  const approvals = page.getByRole('region', {
    name: 'Expiring approvals and requirements',
    exact: true,
  });
  const effective = approvals.getByRole('region', {
    name: 'Expiring approvals',
    exact: true,
  });
  const upcoming = approvals.getByRole('region', { name: 'Upcoming renewals' });
  const expired = approvals.getByRole('region', {
    name: 'Expired approvals',
    exact: true,
  });
  const uncovered = approvals.getByRole('region', {
    name: 'Expired and unresolved',
  });
  const window = approvals.getByRole('combobox', {
    name: 'Expiring approvals and requirements time frame',
  });
  await expect(window).toHaveText('Next 30 days');
  await expect(effective.getByLabel('3 approvals')).toBeVisible();
  await expect(upcoming.getByLabel('2 renewals')).toBeVisible();
  await expect(uncovered.getByLabel('1 renewal')).toBeVisible();
  const family = effective.getByRole('button', {
    name: /Family Coach.*Doe Family/,
  });
  const individual = effective.getByRole('button', {
    name: /Individual Coach.*Doe/,
  });
  const organization = effective.getByRole('button', {
    name: /Partner role.*Community partners/,
  });
  await expect(family).toBeVisible();
  await expect(individual).toBeVisible();
  await expect(organization).toBeVisible();
  await expect(family).toContainText('Related renewals');
  await expect(family).toContainText('Safety check renewal');
  await expect(individual.getByText('Related renewals')).toHaveCount(0);
  await expect(
    upcoming.getByText('Coverage-loss date reached. Last reported as upcoming.')
  ).toBeVisible();
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(new Date(expirationDate));
  await expect(
    approvals.locator(`time[datetime="${expirationDate}"]`).first()
  ).toHaveText(formattedDate);
  await expectNoHorizontalOverflow(page);

  await window.click();
  await page.getByRole('option', { name: 'Next 7 days' }).click();
  await expect(effective).toHaveCount(0);
  await expect(expired.getByLabel('1 approval')).toBeVisible();
  await expect(upcoming.getByLabel('1 renewal')).toBeVisible();
  await expect(uncovered.getByLabel('1 renewal')).toBeVisible();
  await page.reload();
  await expect(window).toHaveText('Next 7 days');
  await expect(
    page.getByRole('combobox', { name: 'Upcoming requirements time frame' })
  ).toHaveText('Next 30 days');
  await expect(
    page.getByRole('combobox', { name: 'Past-due requirements time frame' })
  ).toHaveText('All past due');
  await window.click();
  await page.getByRole('option', { name: 'Next 14 days' }).click();

  const familyRenewal = upcoming.getByRole('button', {
    name: /Household check renewal.*Doe Family/,
  });
  await familyRenewal.focus();
  await familyRenewal.press('Enter');
  await expect(page).toHaveURL(
    (url) =>
      url.pathname.endsWith(`/families/${doeId}`) &&
      url.searchParams.get('approvalAction') === 'Household check renewal'
  );
  await page.goBack();
  await upcoming
    .getByRole('button', { name: /Safety check renewal.*Doe/ })
    .click();
  await expect(page).toHaveURL(
    (url) =>
      url.pathname.endsWith(`/families/${doeId}`) &&
      url.searchParams.has('approvalPersonId') &&
      url.searchParams.get('approvalAction') === 'Safety check renewal'
  );
  await page.goBack();
  await uncovered
    .getByRole('button', {
      name: /Partner screening renewal.*Community partners/,
    })
    .click();
  await expect(page).toHaveURL(
    (url) =>
      url.pathname.endsWith(`/organizations/organization/${communityId}`) &&
      url.searchParams.get('approvalAction') === 'Partner screening renewal'
  );
  await page.goBack();
  await expired
    .getByRole('button', { name: /Legacy Coach.*Expired on/ })
    .click();
  await expect(page).toHaveURL(
    (url) =>
      url.pathname.endsWith(`/families/${doeId}`) &&
      url.searchParams.get('approvalRole') === 'Legacy Coach'
  );
  await expect(
    page.getByRole('button', { name: 'close role details' })
  ).toBeVisible();
  statusOnly = true;
  await page.reload();
  await expect(
    page.getByText('Dashboard selection', { exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'close role details' })
  ).toHaveCount(0);
});
