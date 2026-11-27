import assert from 'node:assert/strict';
import test from 'node:test';
import type { AppNavigate } from '../Hooks/useAppNavigate';
import {
  openDashboardApproval,
  openDashboardArrangement,
} from './dashboardWorkNavigation.ts';

function navigation() {
  const calls: unknown[][] = [];
  const navigate: Pick<AppNavigate, 'family' | 'organization'> = {
    family: (...args) => {
      calls.push(['family', ...args]);
    },
    organization: (...args) => {
      calls.push(['organization', ...args]);
    },
  };
  return { calls, navigate };
}

test('family and individual approval work opens V2 targets or the ordinary legacy family', () => {
  const { calls, navigate } = navigation();
  const family = { kind: 'family', familyId: 'family' } as const;
  const individual = {
    kind: 'individual',
    familyId: 'family',
    familyMemberId: 'member',
  } as const;
  const expiration = { kind: 'role', name: 'Family Coach' } as const;
  const renewal = { kind: 'requirement', name: 'Screening' } as const;
  const flags = { familyV2: true, organizationApprovals: false };
  openDashboardApproval(navigate, family, expiration, flags);
  openDashboardApproval(navigate, individual, renewal, flags);
  openDashboardApproval(navigate, family, expiration, {
    ...flags,
    familyV2: false,
  });
  openDashboardApproval(navigate, individual, renewal, {
    ...flags,
    familyV2: false,
  });
  assert.deepEqual(calls, [
    ['family', 'family', { approval: { ...expiration, personId: undefined } }],
    ['family', 'family', { approval: { ...renewal, personId: 'member' } }],
    ['family', 'family'],
    ['family', 'family'],
  ]);
});

test('organization role links use the approval flag independently of Family V2', () => {
  const { calls, navigate } = navigation();
  const organization = {
    kind: 'organization',
    communityId: 'community',
  } as const;
  const role = { kind: 'role', name: 'Partner' } as const;
  const renewal = { kind: 'requirement', name: 'Screening' } as const;
  openDashboardApproval(navigate, organization, role, {
    familyV2: false,
    organizationApprovals: true,
  });
  openDashboardApproval(navigate, organization, renewal, {
    familyV2: true,
    organizationApprovals: false,
  });
  assert.deepEqual(calls, [
    ['organization', 'community', role],
    ['organization', 'community', undefined],
  ]);
});

test('arrangement links preserve the case for legacy screens', () => {
  const { calls, navigate } = navigation();
  const item = {
    id: 'work-item',
    requirementName: 'Safety visit',
    target: {
      familyId: 'family',
      v1CaseId: 'case',
      arrangementId: 'arrangement',
    },
    occurrenceDate: '2026-11-26',
    status: 'past-due',
  } as const;
  openDashboardArrangement(navigate, item, true);
  openDashboardArrangement(navigate, item, false);
  assert.deepEqual(calls, [
    [
      'family',
      'family',
      {
        v1CaseId: 'case',
        arrangementId: 'arrangement',
        arrangementRequirement: {
          actionName: 'Safety visit',
          date: '2026-11-26',
        },
      },
    ],
    ['family', 'family', { v1CaseId: 'case' }],
  ]);
});
