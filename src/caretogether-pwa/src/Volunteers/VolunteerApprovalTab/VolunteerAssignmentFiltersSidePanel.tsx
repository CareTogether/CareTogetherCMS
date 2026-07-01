import Grid from '@mui/material/Grid';
import { Button, Typography } from '@mui/material';
import { CustomFieldsFilterSelect } from '../../Generic/CustomFieldsFilter/CustomFieldsFilterSelect';
import { CustomFieldFilterOption } from '../../Generic/CustomFieldsFilter/types';
import {
  AssignmentFilterSelectionsByArrangementType,
  AssignmentFilterValue,
} from './assignmentFilters';

type Props = {
  arrangementTypes: string[];
  selectedValuesByArrangementType: AssignmentFilterSelectionsByArrangementType;
  onArrangementTypeChange: (
    arrangementType: string,
    selectedValues: AssignmentFilterValue[]
  ) => void;
  onClose: () => void;
};

const ASSIGNMENT_FILTER_OPTIONS: CustomFieldFilterOption[] = [
  { key: 'Assigned', value: 'assigned', selected: false },
  { key: 'Unassigned', value: 'unassigned', selected: false },
];

function assignmentFilterOptions(selectedValues: AssignmentFilterValue[]) {
  const selectedSet = new Set(selectedValues);

  return ASSIGNMENT_FILTER_OPTIONS.map((option) => ({
    ...option,
    selected: selectedSet.has(option.value as AssignmentFilterValue),
  }));
}

function assignmentFilterValues(
  selectedValues: (string | boolean | null)[]
): AssignmentFilterValue[] {
  return selectedValues.filter(
    (value): value is AssignmentFilterValue =>
      value === 'assigned' || value === 'unassigned'
  );
}

export function VolunteerAssignmentFiltersSidePanel({
  arrangementTypes,
  selectedValuesByArrangementType,
  onArrangementTypeChange,
  onClose,
}: Props) {
  return (
    <Grid
      container
      spacing={2}
      sx={{ maxWidth: 500, paddingBottom: { xs: 10, sm: 4 } }}
    >
      <Grid size={12}>
        <h3>Assignment Filters</h3>
        <Typography>
          Select one or more assignment states for each arrangement type to
          narrow the volunteer list.
        </Typography>
      </Grid>

      {arrangementTypes.map((arrangementType) => {
        const selectedValues =
          selectedValuesByArrangementType[arrangementType] ?? [];

        return (
          <Grid key={arrangementType} size={12}>
            <CustomFieldsFilterSelect
              label={arrangementType}
              options={assignmentFilterOptions(selectedValues)}
              selectedValues={selectedValues}
              onChange={(selectedValues) =>
                onArrangementTypeChange(
                  arrangementType,
                  assignmentFilterValues(selectedValues)
                )
              }
              fullWidth
            />
          </Grid>
        );
      })}

      <Grid size={12} sx={{ textAlign: 'right' }}>
        <Button color="secondary" variant="contained" onClick={onClose}>
          Close
        </Button>
      </Grid>
    </Grid>
  );
}
