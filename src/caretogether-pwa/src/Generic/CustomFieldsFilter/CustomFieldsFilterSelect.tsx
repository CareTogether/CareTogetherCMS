import {
  Checkbox,
  FormControl,
  InputBase,
  ListItemText,
  MenuItem,
  Select,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { CustomFieldFilterOption, CustomFieldFilterValue } from './types';

type Props = {
  label: string;
  options: CustomFieldFilterOption[];
  selectedValues: CustomFieldFilterValue[];
  onChange: (selected: CustomFieldFilterValue[]) => void;
};

export function CustomFieldsFilterSelect({
  label,
  options,
  selectedValues,
  onChange,
}: Props) {
  const selectedCount = selectedValues.length;
  const displayText = `${label}: ${selectedCount} of ${options.length}`;

  return (
    <FormControl sx={{ position: 'relative' }}>
      <Select
        labelId={`customField${label}Filter`}
        displayEmpty
        sx={{
          color: selectedValues.length === options.length ? '#bdbdbd' : null,
          '& .MuiSelect-iconOpen': { transform: 'none' },
        }}
        multiple
        value={selectedValues as any}
        variant="standard"
        label={`${label} Filters`}
        onChange={(event) => {
          const selected = event.target.value;
          if (typeof selected !== 'string') {
            onChange(selected as CustomFieldFilterValue[]);
          }
        }}
        input={<InputBase />}
        IconComponent={FilterListIcon}
        renderValue={() => displayText}
      >
        {options.map((option) => (
          <MenuItem key={option.key} value={option.value as any}>
            <Checkbox checked={selectedValues.includes(option.value)} />
            <ListItemText primary={option.key} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
