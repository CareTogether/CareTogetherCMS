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

type VolunteerFilterProps = {
  label: string;
  options: string[];
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
        displayEmpty
        sx={{
          color: value?.length === options.length ? '#bdbdbd' : null,
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
          return value?.length === options.length
            ? `${label}: all`
            : `${label}: ${value?.length} of ${options.length}`;
        }}
      >
        {options.map((option) => (
          <MenuItem key={option} value={option ?? ''}>
            <Checkbox checked={value?.includes(option)} />
            <ListItemText primary={option} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
