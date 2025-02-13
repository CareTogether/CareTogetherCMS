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
import { filterOption } from './filterOption';

type VolunteerFilterProps = {
  label: string;
  options: filterOption[];
  setSelected: (selected: string | string[]) => void;
};

export function VolunteerFilter({
  label,
  options,
  setSelected,
}: VolunteerFilterProps) {
  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const allOptionKeysPlusSelectedOptionValue = event.target.value;
    setSelected(allOptionKeysPlusSelectedOptionValue);
  };

  return (
    <FormControl sx={{ position: 'relative' }}>
      <Select
        labelId={`volunteer${label}Filter`}
        sx={{
          color:
            options.filter((o) => o.selected).length === options.length
              ? '#bdbdbd'
              : null,
          '& .MuiSelect-iconOpen': { transform: 'none' },
        }}
        multiple
        value={options.map((o) => o.key)}
        variant="standard"
        label={`${label} Filters`}
        onChange={handleChange}
        input={<InputBase />}
        IconComponent={FilterListIcon}
        renderValue={() => {
          const selectedOptions = options.filter((o) => o.selected);
          return selectedOptions.length === options.length
            ? `${label}: all`
            : `${label}: ${selectedOptions.length} of ${options.length}`;
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.key} value={option.value ?? ''}>
            <Checkbox checked={option.selected} />
            <ListItemText primary={option.key} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
