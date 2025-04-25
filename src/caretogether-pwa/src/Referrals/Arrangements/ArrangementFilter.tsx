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

type ArrangementFilterProps = {
  selectedOptions: string[];
  onChange: (selectedOptions: string[]) => void;
};

export function ArrangementFilter({
  selectedOptions,
  onChange,
}: ArrangementFilterProps) {
  const filterOptions = ['Active', 'Cancelled', 'Ended'];

  return (
    <FormControl sx={{ position: 'relative', minWidth: 160 }}>
      <Select
        multiple
        value={selectedOptions}
        onChange={(event: SelectChangeEvent<string[]>) => {
          const value = event.target.value as string[];
          onChange(value);
        }}
        input={<InputBase />}
        IconComponent={FilterListIcon}
        renderValue={() =>
          `${selectedOptions.length} of ${filterOptions.length}`
        }
        sx={{ '.MuiSelect-icon': { right: 90 } }}
      >
        {filterOptions.map((option) => (
          <MenuItem key={option} value={option}>
            <Checkbox checked={selectedOptions.includes(option)} />
            <ListItemText primary={option} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
