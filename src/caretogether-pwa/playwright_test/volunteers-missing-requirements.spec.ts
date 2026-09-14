import { expect, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  completeRequirementFilterValue,
  missingRequirementFilterValue,
} from '../src/Volunteers/VolunteerApprovalTab/volunteerMissingRequirementsPresentation';
import { buildVolunteersGridColumns } from '../src/Volunteers/volunteersGridColumns';
import type { VolunteerBrowserRowV2 } from '../src/Volunteers/useVolunteersBrowserViewModel';

function row(
  missingRequirementGroups: VolunteerBrowserRowV2['missingRequirementGroups']
): VolunteerBrowserRowV2 {
  const requirements = missingRequirementGroups.flatMap(
    (group) => group.requirements
  );

  return {
    arrangementAssignmentValues: {},
    family: 'Brambleswift Family',
    familyCustomFieldValues: {},
    familyLastName: 'Brambleswift',
    id: 'family-1',
    missingRequirementGroups,
    primaryContact: 'Berrin Brambleswift',
    requirementFilterValues: requirements.length
      ? [missingRequirementFilterValue, ...requirements]
      : [completeRequirementFilterValue],
    roleFilterValues: [],
    roles: {} as VolunteerBrowserRowV2['roles'],
    searchableText: 'Berrin Brambleswift Family',
    sourceFamily: {} as VolunteerBrowserRowV2['sourceFamily'],
    statusFilterValues: [],
    statusLabels: [],
    volunteerFamilyCount: 1,
    volunteerCustomFieldValues: {},
  };
}

function missingRequirementsColumn(rows: VolunteerBrowserRowV2[]) {
  const column = buildVolunteersGridColumns({
    arrangementTypes: [],
    familyCustomFields: [],
    roleNames: [],
    rows,
    volunteerCustomFields: [],
  }).find((item) => item.field === 'missingRequirements');

  if (!column) throw new Error('Missing Requirements column was not found.');
  return column;
}

test('Missing Requirements preserves subject groups and hides filter sentinels', () => {
  const incompleteRow = row([
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
  ]);
  const completeRow = row([]);
  const column = missingRequirementsColumn([incompleteRow, completeRow]);
  const formatter = column.valueFormatter!;
  const renderCell = column.renderCell!;

  expect(
    formatter(incompleteRow.requirementFilterValues, incompleteRow, column)
  ).toBe(
    'Family: Meet & Greet; Berrin Brambleswift: Comprehensive Background Check, Reference; Elda Brambleswift: Comprehensive Background Check'
  );
  expect(
    formatter(completeRow.requirementFilterValues, completeRow, column)
  ).toBe('Complete');
  expect(
    formatter(
      [missingRequirementFilterValue],
      {} as VolunteerBrowserRowV2,
      column
    )
  ).toBe('Missing');
  expect(
    formatter(
      [completeRequirementFilterValue],
      {} as VolunteerBrowserRowV2,
      column
    )
  ).toBe('Complete');
  expect(column.valueOptions).toContainEqual({
    label: 'Missing',
    value: missingRequirementFilterValue,
  });
  expect(column.valueOptions).toContainEqual({
    label: 'Complete',
    value: completeRequirementFilterValue,
  });

  const rendered = renderToStaticMarkup(
    renderCell({
      row: incompleteRow,
      value: incompleteRow.requirementFilterValues,
    } as never)
  );

  expect(rendered).toContain('Family');
  expect(rendered).toContain('Meet &amp; Greet');
  expect(rendered).toContain('Berrin Brambleswift');
  expect(rendered).toContain('Elda Brambleswift');
  expect(rendered).not.toContain(missingRequirementFilterValue);
  expect(rendered).not.toContain(completeRequirementFilterValue);
});
