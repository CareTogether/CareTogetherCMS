import { expect, test } from './support/fixtures';
import {
  ATLANTIS_LOCATION_ID,
  ATLANTIS_ORGANIZATION_ID,
  ATLANTIS_ROUTE,
  EL_DORADO_LOCATION_ID,
  locationRoute,
} from './support/constants';
import { expectNoHorizontalOverflow } from './support/layout';

const doeId = '11111111-1111-1111-1111-111111111111';

test.use({
  timezoneId: 'Pacific/Honolulu',
  viewport: { width: 375, height: 700 },
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
