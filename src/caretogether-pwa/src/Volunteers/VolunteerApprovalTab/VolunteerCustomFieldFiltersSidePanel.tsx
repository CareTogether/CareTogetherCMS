import { Button, Grid, Typography } from '@mui/material';
import { CustomField } from '../../GeneratedClient';
import { CustomFieldsFilter } from '../../Generic/CustomFieldsFilter/CustomFieldsFilter';
import {
  CustomFieldFilterOption,
  CustomFieldFilterSelectionsByField,
  CustomFieldFilterValue,
} from '../../Generic/CustomFieldsFilter/types';

type Props = {
  customFields: CustomField[];
  optionsByField: Record<string, CustomFieldFilterOption[]>;
  selectedValuesByField: CustomFieldFilterSelectionsByField;
  onFieldChange: (
    fieldName: string,
    selectedValues: CustomFieldFilterValue[]
  ) => void;
  onClose: () => void;
};

export function VolunteerCustomFieldFiltersSidePanel({
  customFields,
  optionsByField,
  selectedValuesByField,
  onFieldChange,
  onClose,
}: Props) {
  return (
    <Grid
      container
      spacing={2}
      maxWidth={500}
      sx={{ paddingBottom: { xs: 10, sm: 4 } }}
    >
      <Grid item xs={12}>
        <h3>Custom Field Filters</h3>
        <Typography>
          Select one or more values for each custom field to narrow the
          volunteer list.
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <CustomFieldsFilter
          customFields={customFields}
          optionsByField={optionsByField}
          selectedValuesByField={selectedValuesByField}
          onFieldChange={onFieldChange}
          direction="column"
          fullWidthSelects
        />
      </Grid>

      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        <Button color="secondary" variant="contained" onClick={onClose}>
          Close
        </Button>
      </Grid>
    </Grid>
  );
}
