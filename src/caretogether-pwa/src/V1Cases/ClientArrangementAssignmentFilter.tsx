import { Autocomplete, Stack, TextField } from '@mui/material';
import type { GridFilterInputValueProps } from '@mui/x-data-grid-premium';
import {
  clientArrangementAssignmentFilterValue,
  type ClientArrangementAssignmentFilterValue,
  type ClientArrangementFunctionAssignmentV2,
} from './clientArrangementFunctions';

type ClientArrangementAssignmentFilterProps = GridFilterInputValueProps & {
  assignments: ClientArrangementFunctionAssignmentV2[];
};

type AssigneeOption = {
  label: string;
  value: string;
};

function sortedUnique(values: Array<string | null>) {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value)))
  ).sort((first, second) => first.localeCompare(second));
}

function assignmentsInContext(
  assignments: ClientArrangementFunctionAssignmentV2[],
  value: ClientArrangementAssignmentFilterValue,
  ignoredField?: keyof ClientArrangementAssignmentFilterValue
) {
  return assignments.filter(
    (assignment) =>
      (ignoredField === 'arrangementType' ||
        !value.arrangementType ||
        assignment.arrangementType === value.arrangementType) &&
      (ignoredField === 'arrangementPolicyVersion' ||
        !value.arrangementPolicyVersion ||
        assignment.arrangementPolicyVersion ===
          value.arrangementPolicyVersion) &&
      (ignoredField === 'functionName' ||
        !value.functionName ||
        assignment.functionName === value.functionName) &&
      (ignoredField === 'assignmentId' ||
        !value.assignmentId ||
        assignment.assignmentId === value.assignmentId)
  );
}

export function ClientArrangementAssignmentFilter({
  applyValue,
  assignments,
  disabled,
  focusElementRef,
  item,
}: ClientArrangementAssignmentFilterProps) {
  const value = clientArrangementAssignmentFilterValue(item.value) ?? {};
  const apply = (next: ClientArrangementAssignmentFilterValue) => {
    const normalized = clientArrangementAssignmentFilterValue(next);
    applyValue({ ...item, value: normalized ?? undefined });
  };
  const arrangementTypes = sortedUnique(
    assignments.map((assignment) => assignment.arrangementType)
  );
  const functionNames = sortedUnique(
    assignmentsInContext(assignments, value, 'functionName').map(
      (assignment) => assignment.functionName
    )
  );
  const versions = sortedUnique(
    assignmentsInContext(assignments, value, 'arrangementPolicyVersion').map(
      (assignment) => assignment.arrangementPolicyVersion
    )
  );
  const assigneeOptions = Array.from(
    new Map(
      assignmentsInContext(assignments, value, 'assignmentId').flatMap(
        (assignment) =>
          assignment.assignmentId && assignment.assignmentLabel
            ? [
                [
                  assignment.assignmentId,
                  {
                    value: assignment.assignmentId,
                    label: assignment.assignmentLabel,
                  },
                ] as const,
              ]
            : []
      )
    ).values()
  ).sort((first, second) => first.label.localeCompare(second.label));
  const selectedAssignee =
    assigneeOptions.find((option) => option.value === value.assignmentId) ??
    null;

  return (
    <Stack spacing={1} sx={{ width: 280 }}>
      <Autocomplete
        disabled={disabled}
        onChange={(_event, arrangementType) =>
          apply(arrangementType ? { arrangementType } : {})
        }
        options={arrangementTypes}
        renderInput={(params) => (
          <TextField
            {...params}
            inputRef={focusElementRef}
            label="Arrangement type"
          />
        )}
        size="small"
        value={value.arrangementType ?? null}
      />
      <Autocomplete
        disabled={disabled}
        onChange={(_event, functionName) =>
          apply({
            ...(value.arrangementType && {
              arrangementType: value.arrangementType,
            }),
            ...(functionName && { functionName }),
          })
        }
        options={functionNames}
        renderInput={(params) => (
          <TextField {...params} label="Arrangement function" />
        )}
        size="small"
        value={value.functionName ?? null}
      />
      <Autocomplete
        disabled={disabled}
        getOptionLabel={(version) => `Version ${version}`}
        onChange={(_event, arrangementPolicyVersion) =>
          apply({
            ...value,
            arrangementPolicyVersion: arrangementPolicyVersion ?? undefined,
            assignmentId: undefined,
          })
        }
        options={versions}
        renderInput={(params) => (
          <TextField {...params} label="Policy version (optional)" />
        )}
        size="small"
        value={value.arrangementPolicyVersion ?? null}
      />
      <Autocomplete<AssigneeOption>
        disabled={disabled}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, selected) =>
          option.value === selected.value
        }
        onChange={(_event, assignee) =>
          apply({
            ...value,
            assignmentId: assignee?.value,
          })
        }
        options={assigneeOptions}
        renderInput={(params) => (
          <TextField {...params} label="Assigned volunteer" />
        )}
        size="small"
        value={selectedAssignee}
      />
    </Stack>
  );
}

export type { ClientArrangementAssignmentFilterProps };
