import {
  Checkbox,
  FormControl,
  InputBase,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { CustomFieldFilterOption, CustomFieldFilterValue } from './types';

type Props = {
  label: string;
  options: CustomFieldFilterOption[];
  selectedValues: CustomFieldFilterValue[];
  onChange: (selected: CustomFieldFilterValue[]) => void;
  fullWidth?: boolean;
};

function encodeValue(value: CustomFieldFilterValue) {
  if (value === null) {
    return '__null__';
  }

  if (typeof value === 'boolean') {
    return `__bool__:${value}`;
  }

  return `__string__:${value}`;
}

function decodeValue(value: string): CustomFieldFilterValue {
  if (value === '__null__') {
    return null;
  }

  if (value.startsWith('__bool__:')) {
    return value === '__bool__:true';
  }

  return value.replace('__string__:', '');
}

export function CustomFieldsFilterSelect({
  label,
  options,
  selectedValues,
  onChange,
  fullWidth = false,
}: Props) {
  const selectedCount = selectedValues.length;
  const selectedOptionValues = selectedValues.map(encodeValue);
  const displayText =
    selectedCount === options.length
      ? label
      : `${label} (${selectedCount}/${options.length})`;

  return (
    <FormControl
      sx={{
        position: 'relative',
        minWidth: { xs: '100%', sm: 0 },
        maxWidth: fullWidth ? '100%' : { xs: '100%', sm: '16rem' },
        width: fullWidth ? '100%' : 'auto',
      }}
    >
      <Select
        labelId={`customField${label}Filter`}
        displayEmpty
        sx={{
          minWidth: { xs: '100%', sm: 0 },
          maxWidth: '100%',
          color: selectedValues.length === options.length ? '#bdbdbd' : null,
          '& .MuiSelect-iconOpen': { transform: 'none' },
          '& .MuiSelect-select': {
            overflow: fullWidth ? 'visible' : 'hidden',
            textOverflow: fullWidth ? 'clip' : 'ellipsis',
            whiteSpace: fullWidth ? 'normal' : 'nowrap',
            overflowWrap: fullWidth ? 'anywhere' : 'normal',
          },
        }}
        multiple
        value={selectedOptionValues}
        variant="standard"
        label={`${label} Filters`}
        onChange={(event: SelectChangeEvent<string[]>) => {
          const selected = event.target.value;
          if (typeof selected !== 'string') {
            onChange(selected.map(decodeValue));
          }
        }}
        input={<InputBase />}
        IconComponent={FilterListIcon}
        SelectDisplayProps={{ title: displayText }}
        renderValue={() => displayText}
      >
        {options.map((option) => (
          <MenuItem key={option.key} value={encodeValue(option.value)}>
            <Checkbox checked={selectedValues.includes(option.value)} />
            <ListItemText primary={option.key} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
