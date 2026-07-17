import { AssignedIndividualVolunteer, Person } from '../GeneratedClient';
import type { SelectProps } from '@mui/material';
import { CustomFieldsFilterSelect } from '../Generic/CustomFieldsFilter/CustomFieldsFilterSelect';
import {
  CustomFieldFilterOption,
  CustomFieldFilterValue,
} from '../Generic/CustomFieldsFilter/types';
import { personNameString } from '../Families/PersonName';
import { AssignmentFilterSelectionsByRole } from './assignmentRoleColumns';

type AssignmentRoleFiltersProps = {
  assignmentRoles: string[];
  assignments: AssignedIndividualVolunteer[];
  selectedValuesByRole: AssignmentFilterSelectionsByRole;
  onChange: (assignmentRole: string, selectedValues: (string | null)[]) => void;
  personLookup: (personId: string) => Person | undefined;
  size?: SelectProps<string[]>['size'];
  variant?: SelectProps<string[]>['variant'];
};

function assignmentFilterOptions(
  assignmentRole: string,
  assignments: AssignedIndividualVolunteer[],
  selectedValues: (string | null)[],
  personLookup: (personId: string) => Person | undefined
) {
  const assignedPersonIds = Array.from(
    new Set(
      assignments
        .filter((assignment) => assignment.assignmentRole === assignmentRole)
        .map((assignment) => assignment.personId)
    )
  );

  const selectedSet = new Set<string | null>(selectedValues);
  const personOptions: CustomFieldFilterOption[] = assignedPersonIds
    .map((personId) => ({
      key: personNameString(personLookup(personId)),
      value: personId,
      selected: selectedSet.has(personId),
    }))
    .sort((a, b) => a.key.localeCompare(b.key));

  return [
    {
      key: 'Unassigned',
      value: null,
      selected: selectedSet.has(null),
    },
    ...personOptions,
  ];
}

function assignmentFilterValues(
  selectedValues: CustomFieldFilterValue[]
): (string | null)[] {
  return selectedValues.filter(
    (value): value is string | null =>
      typeof value === 'string' || value === null
  );
}

export function AssignmentRoleFilters({
  assignmentRoles,
  assignments,
  selectedValuesByRole,
  onChange,
  personLookup,
  size,
  variant,
}: AssignmentRoleFiltersProps) {
  return (
    <>
      {assignmentRoles.map((assignmentRole) => {
        const selectedValues = selectedValuesByRole[assignmentRole] ?? [];

        return (
          <CustomFieldsFilterSelect
            key={assignmentRole}
            label={assignmentRole}
            options={assignmentFilterOptions(
              assignmentRole,
              assignments,
              selectedValues,
              personLookup
            )}
            selectedValues={selectedValues}
            size={size}
            variant={variant}
            onChange={(selectedValues) =>
              onChange(assignmentRole, assignmentFilterValues(selectedValues))
            }
          />
        );
      })}
    </>
  );
}
