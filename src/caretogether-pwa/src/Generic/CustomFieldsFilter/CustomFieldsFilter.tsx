import { CustomField } from '../../GeneratedClient';
import { Box } from '@mui/material';
import { CustomFieldsFilterSelect } from './CustomFieldsFilterSelect';
import {
  CustomFieldFilterOption,
  CustomFieldFilterSelectionsByField,
  CustomFieldFilterValue,
} from './types';

type Props = {
  customFields: CustomField[];
  getOptionsForField: (field: CustomField) => CustomFieldFilterOption[];
  selectedValuesByField: CustomFieldFilterSelectionsByField;
  onFieldChange: (
    fieldName: string,
    selectedValues: CustomFieldFilterValue[]
  ) => void;
  direction?: 'row' | 'column';
  fullWidthSelects?: boolean;
};

export function CustomFieldsFilter({
  customFields,
  getOptionsForField,
  selectedValuesByField,
  onFieldChange,
  direction = 'row',
  fullWidthSelects = false,
}: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: direction,
        flexWrap: direction === 'row' ? 'wrap' : 'nowrap',
        gap: 1,
        width: '100%',
      }}
    >
      {customFields.map((field) => {
        if (!field.name) return null;

        const selectedValues = selectedValuesByField[field.name] ?? [];

        return (
          <CustomFieldsFilterSelect
            key={field.name}
            label={field.name}
            getOptions={() => getOptionsForField(field)}
            selectedValues={selectedValues}
            onChange={(selected) => onFieldChange(field.name, selected)}
            fullWidth={fullWidthSelects}
          />
        );
      })}
    </Box>
  );
}
