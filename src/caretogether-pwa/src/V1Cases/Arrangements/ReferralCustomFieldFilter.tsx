import {
  Checkbox,
  FormControl,
  InputBase,
  ListItemText,
  MenuItem,
  Select,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';

type FilterOption = {
  key: string;
  value: string | boolean | null;
  selected: boolean;
};

type ReferralCustomFieldFilterProps = {
  label: string;
  options: FilterOption[];
  onChange: (selected: Array<string | boolean | null>) => void;
};

export function ReferralCustomFieldFilter({
  label,
  options,
  onChange,
}: ReferralCustomFieldFilterProps) {
  const selectedValues = options
    .filter((option) => option.selected)
    .map((o) => o.value);

  const selectedCount = selectedValues.length;
  const displayText = `${label}: ${selectedCount} of ${options.length}`;

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
        onChange={(event) => {
          const selected = event.target.value;
          if (typeof selected !== 'string') {
            onChange(selected);
          }
        }}
        input={<InputBase />}
        IconComponent={FilterListIcon}
        renderValue={() => displayText}
        sx={{
          '& .MuiSelect-icon': { color: '#757575' },
          '& .MuiSelect-select': { fontSize: 14 },
        }}
      >
        {options.map((option) => {
          const isChecked = selectedValues.includes(option.value);
          return (
            <MenuItem key={option.key} value={option.value as any}>
              <Checkbox checked={isChecked} />
              <ListItemText primary={option.key} />
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
}
