import { Box, Chip } from '@mui/material';
import { ReactNode } from 'react';
import { sortByPolicyOrder } from '../../Generic/sortByPolicyOrder';
import { CustomFieldType } from '../../GeneratedClient';
import { formatCustomFieldValue } from '../../Generic/customFieldValue';

export function renderVolunteerCustomFieldValue(
  value: unknown,
  validValues?: string[],
  type?: CustomFieldType
): ReactNode {
  if (value === null || typeof value === 'undefined') {
    return '';
  }
  if (value === true) {
    return 'Yes';
  }
  if (value === false) {
    return 'No';
  }
  if (Array.isArray(value)) {
    const sortedValue =
      validValues && validValues.length > 0
        ? sortByPolicyOrder(value.map(String), validValues)
        : value;
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '.25rem' }}>
        {sortedValue.map((item) => (
          <Chip key={String(item)} size="small" label={String(item)} />
        ))}
      </Box>
    );
  }
  return formatCustomFieldValue(type, value);
}
