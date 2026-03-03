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
  const selectedCount = options.filter((option) => option.selected).length;
  const displayText =
    selectedCount === options.length
      ? label
      : `${label} (${selectedCount}/${options.length})`;

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const allOptionKeysPlusSelectedOptionValue = event.target.value;
    setSelected(allOptionKeysPlusSelectedOptionValue);
  };

  return (
    <FormControl
      sx={{
        position: 'relative',
        minWidth: { xs: '100%', sm: 0 },
        maxWidth: { xs: '100%', sm: '16rem' },
      }}
    >
      <Select
        labelId={`volunteer${label}Filter`}
        sx={{
          minWidth: { xs: '100%', sm: 0 },
          maxWidth: '100%',
          color: selectedCount === options.length ? '#bdbdbd' : null,
          '& .MuiSelect-iconOpen': { transform: 'none' },
          '& .MuiSelect-select': {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          },
        }}
        multiple
        value={options.map((o) => o.key)}
        variant="standard"
        label={`${label} Filters`}
        onChange={handleChange}
        input={<InputBase />}
        IconComponent={FilterListIcon}
        SelectDisplayProps={{ title: displayText }}
        renderValue={() => displayText}
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
