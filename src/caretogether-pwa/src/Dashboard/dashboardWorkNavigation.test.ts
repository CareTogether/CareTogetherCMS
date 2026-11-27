import assert from 'node:assert/strict';
import test from 'node:test';
import type { AppNavigate } from '../Hooks/useAppNavigate';
import { openDashboardArrangement } from './dashboardWorkNavigation.ts';

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
