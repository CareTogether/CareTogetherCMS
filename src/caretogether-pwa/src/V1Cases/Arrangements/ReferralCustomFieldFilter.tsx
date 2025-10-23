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

type FilterOption = {
  key: string;
  value?: string;
  selected: boolean;
};

type ReferralCustomFieldFilterProps = {
  label: string;
  options: FilterOption[];
  onChange: (selected: string[]) => void;
};

export function ReferralCustomFieldFilter({
  label,
  options,
  onChange,
}: ReferralCustomFieldFilterProps) {
  const displayOptions = [...options];
  if (!displayOptions.some((o) => o.key === 'Blank')) {
    displayOptions.push({ key: 'Blank', value: 'Blank', selected: false });
  }

  displayOptions.sort((a, b) => {
    const order = (key: string): number => {
      if (key === 'Yes') return 1;
      if (key === 'No') return 2;
      if (key === 'Blank') return 999;
      return 500;
    };

    const orderDiff = order(a.key) - order(b.key);
    if (orderDiff !== 0) return orderDiff;
    return a.key.localeCompare(b.key);
  });

  const selectedValues = displayOptions
    .filter((o) => o.selected)
    .map((o) => o.value ?? '');

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const selected = event.target.value as string[];
    onChange(selected);
  };

  const selectedCount = selectedValues.length;
  const displayText = `${label}: ${selectedCount} of ${displayOptions.length}`;

  return (
    <FormControl
      sx={{
        position: 'relative',
        minWidth: 180,
        mx: 1,
      }}
    >
      <Select
        multiple
        variant="standard"
        displayEmpty
        value={selectedValues}
        onChange={handleChange}
        input={<InputBase />}
        IconComponent={FilterListIcon}
        renderValue={() => displayText}
        sx={{
          '& .MuiSelect-icon': { color: '#757575' },
          '& .MuiSelect-select': { fontSize: 14 },
        }}
      >
        {displayOptions.map((option) => {
          const isChecked = selectedValues.includes(option.value ?? '');
          return (
            <MenuItem key={option.key} value={option.value ?? ''}>
              <Checkbox checked={isChecked} />
              <ListItemText primary={option.key} />
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
}
