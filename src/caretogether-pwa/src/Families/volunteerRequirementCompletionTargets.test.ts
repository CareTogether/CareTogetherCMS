import assert from 'node:assert/strict';
import test from 'node:test';
import type { VolunteerInfo } from '../GeneratedClient.ts';
import type { ApprovalLedgerOccurrence } from '../Approvals/approvalLedgerViewModel.ts';
import { volunteerRequirementCompletionPersonIds } from './volunteerRequirementCompletionTargets.ts';

const familyOccurrence = {
  status: 'missing',
  context: {
    kind: 'Volunteer Family',
    volunteerFamilyId: 'family-1',
  },
} as ApprovalLedgerOccurrence;

test('finds people missing a family-scoped requirement', () => {
  const individualVolunteers = {
    'person-1': {
      missingRequirements: [{ item1: 'Background Check' }],
      missingOptionalRequirements: [],
    },
    'person-2': {
      missingRequirements: [{ item1: 'Background Check' }],
      missingOptionalRequirements: [],
    },
    'person-3': {
      missingRequirements: [{ item1: 'Training' }],
      missingOptionalRequirements: [],
    },
  } as unknown as Record<string, VolunteerInfo>;

  assert.deepEqual(
    volunteerRequirementCompletionPersonIds({
      occurrence: familyOccurrence,
      relatedOccurrences: [],
      requirementName: 'Background Check',
      individualVolunteers,
    }),
    ['person-1', 'person-2']
  );
});
