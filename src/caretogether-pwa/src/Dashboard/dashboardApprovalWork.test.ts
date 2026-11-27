import assert from 'node:assert/strict';
import test from 'node:test';
import type { ApprovalExpirationWorkItem } from './approvalExpirationWorkQueue';
import type { ExpiringRequirementWorkItem } from './expiringRequirementWorkQueue';
import {
  affectedApprovalRoleLabel,
  selectDashboardApprovalWork,
} from './dashboardApprovalWork.ts';

const scope = { organizationId: 'org', locationId: 'loc' };
const today = new Date('2026-12-31T00:30:00Z');
const requirement: ExpiringRequirementWorkItem = {
  key: 'check',
  snoozeToken: 'check-token',
  actionName: 'Safety check',
  scope,
  target: { kind: 'individual', familyId: 'family', familyMemberId: 'person' },
  expirationDate: '2027-01-07',
  affectedRoles: [{ scope: 'individual', roleName: 'Coach' }],
};
const approval = {
  id: 'approval',
  scope,
  target: { kind: 'individual', familyId: 'family', familyMemberId: 'person' },
  roleName: 'Coach',
  expirationDate: '2027-01-07',
  status: 'expiring',
  previousStatus: 2,
} as unknown as ApprovalExpirationWorkItem;

test('splits requirements into expiring and recently expired by the window', () => {
  const at = (expirationDate: string) => ({ ...requirement, expirationDate });
  const work = selectDashboardApprovalWork(
    [],
    [
      at('2026-12-20'),
      at('2026-12-24'),
      at('2026-12-31'),
      at('2027-01-07'),
      at('2027-01-08'),
    ],
    today,
    7
  );
  assert.deepEqual(
    work.expiringRequirements.map(({ expirationDate }) => expirationDate),
    ['2027-01-07']
  );
  assert.deepEqual(
    work.expiredRequirements.map(({ expirationDate }) => expirationDate),
    ['2026-12-31']
  );
});

test('an expiring approval lists the requirements that expire with it', () => {
  const work = selectDashboardApprovalWork(
    [approval],
    [
      requirement,
      { ...requirement, key: 'other', expirationDate: '2027-01-06' },
    ],
    today,
    30
  );
  assert.deepEqual(
    work.expiring.map(({ relatedRequirements }) =>
      relatedRequirements.map(({ key }) => key)
    ),
    [['check']]
  );
  assert.equal(
    affectedApprovalRoleLabel({ scope: 'family', roleName: 'Host' }),
    'Family: Host'
  );
});
