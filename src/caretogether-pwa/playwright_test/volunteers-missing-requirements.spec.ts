import { expect, test } from '@playwright/test';
import {
  completeRequirementFilterValue,
  missingRequirementFilterValue,
  type VolunteerMissingRequirementGroup,
} from '../src/Volunteers/VolunteerApprovalTab/volunteerMissingRequirementsPresentation';
import {
  buildVolunteersGridColumns,
  formatMissingRequirements,
  formatRequirementFilterValues,
  requirementFilterLabel,
  requirementFilterOptions,
} from '../src/Volunteers/volunteersGridColumns';

function missingRequirementsColumn() {
  const column = buildVolunteersGridColumns({
    arrangementTypes: [],
    familyCustomFields: [],
    roleNames: [],
    rows: [],
    volunteerCustomFields: [],
  }).find((item) => item.field === 'missingRequirements');

  if (!column || column.type !== 'multiSelect') {
    throw new Error('Missing Requirements column was not found.');
  }

  return column;
}

test('Missing Requirements preserves subject groups and hides filter sentinels', () => {
  const incompleteGroups: VolunteerMissingRequirementGroup[] = [
    {
      label: 'Family',
      requirements: ['Meet & Greet'],
    },
    {
      label: 'Berrin Brambleswift',
      requirements: ['Comprehensive Background Check', 'Reference'],
    },
    {
      label: 'Elda Brambleswift',
      requirements: ['Comprehensive Background Check'],
    },
  ];
  const completeGroups: VolunteerMissingRequirementGroup[] = [];
  const column = missingRequirementsColumn();

  expect(formatMissingRequirements(incompleteGroups)).toBe(
    'Family: Meet & Greet; Berrin Brambleswift: Comprehensive Background Check, Reference; Elda Brambleswift: Comprehensive Background Check'
  );
  expect(formatMissingRequirements(completeGroups)).toBe('Complete');
  expect(formatRequirementFilterValues([missingRequirementFilterValue])).toBe(
    'Missing'
  );
  expect(formatRequirementFilterValues([completeRequirementFilterValue])).toBe(
    'Complete'
  );
  expect(requirementFilterLabel(missingRequirementFilterValue)).toBe('Missing');
  expect(requirementFilterLabel(completeRequirementFilterValue)).toBe(
    'Complete'
  );
  expect(
    requirementFilterOptions([
      missingRequirementFilterValue,
      completeRequirementFilterValue,
      'Meet & Greet',
    ])
  ).toEqual([
    { label: 'Missing', value: missingRequirementFilterValue },
    { label: 'Complete', value: completeRequirementFilterValue },
    { label: 'Meet & Greet', value: 'Meet & Greet' },
  ]);
  expect(formatMissingRequirements(incompleteGroups)).not.toContain(
    missingRequirementFilterValue
  );
  expect(formatMissingRequirements(incompleteGroups)).not.toContain(
    completeRequirementFilterValue
  );
  expect(column.aggregable).toBe(false);
  expect(column.pivotable).toBe(false);
  expect(column.chartable).toBe(false);
  expect(column.filterOperators).not.toHaveLength(0);
});
