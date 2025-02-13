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
  value?: string[];
};

export function VolunteerCustomFieldsFilter({
  label,
  options,
  setSelected,
  value,
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
        value={value}
        variant="standard"
        label={`${label} Filters`}
        onChange={handleChange}
        input={<InputBase />}
        IconComponent={FilterListIcon}
        renderValue={() => {
          return value?.length === 0
            ? `${label}: all`
            : `${label}: ${value?.length} of ${options.length}`;
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
