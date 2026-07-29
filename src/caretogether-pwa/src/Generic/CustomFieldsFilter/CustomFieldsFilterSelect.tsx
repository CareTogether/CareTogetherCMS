import {
  Checkbox,
  FormControl,
  InputBase,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import type { SelectProps } from '@mui/material';
import { FilterList as FilterListIcon } from '@mui/icons-material';
import { useMemo, useState } from 'react';
import { CustomFieldFilterOption, CustomFieldFilterValue } from './types';

type Props = {
  label: string;
  options?: CustomFieldFilterOption[];
  getOptions?: () => CustomFieldFilterOption[];
  selectedValues: CustomFieldFilterValue[];
  onChange: (selected: CustomFieldFilterValue[]) => void;
  fullWidth?: boolean;
  size?: SelectProps<string[]>['size'];
  variant?: SelectProps<string[]>['variant'];
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
  getOptions,
  options: providedOptions,
  selectedValues,
  onChange,
  fullWidth = false,
  size,
  variant = 'standard',
}: Props) {
  const [open, setOpen] = useState(false);
  const selectedCount = selectedValues.length;
  const shouldLoadOptions = open || selectedCount > 0 || !getOptions;
  const options = useMemo(
    () => (shouldLoadOptions ? (getOptions?.() ?? providedOptions ?? []) : []),
    [getOptions, providedOptions, shouldLoadOptions]
  );
  const selectedOptionValues = useMemo(
    () => selectedValues.map(encodeValue),
    [selectedValues]
  );
  const displayText = (() => {
    if (selectedCount === 0) return label;
    if (options.length === 0) return `${label} (${selectedCount})`;
    if (selectedCount === options.length) return label;
    return `${label} (${selectedCount}/${options.length})`;
  })();

  return (
    <FormControl
      sx={{
        position: 'relative',
        minWidth: { xs: '100%', sm: 0 },
        maxWidth: fullWidth ? '100%' : { xs: '100%', sm: '16rem' },
        width: fullWidth ? '100%' : 'auto',
      }}
    >
      <Select<string[]>
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
        variant={variant}
        size={size}
        label={`${label} Filters`}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        onChange={(event: SelectChangeEvent<string[]>) => {
          const selected = event.target.value;
          if (typeof selected !== 'string') {
            onChange(selected.map(decodeValue));
          }
        }}
        {...(variant === 'standard'
          ? { input: <InputBase />, IconComponent: FilterListIcon }
          : {})}
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
