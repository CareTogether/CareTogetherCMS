import {
  Checkbox,
  ListItemText,
  Menu,
  MenuItem,
} from '@mui/material';
import { useState } from 'react';
import { VolunteerBrowserFilterButtonV2 } from '../VolunteerBrowserFilterButtonV2';
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const selectedCount = options.filter((option) => option.selected).length;

  function handleOptionClick(option: filterOption) {
    setSelected(options.map((option) => option.key).concat(option.value ?? ''));
  }

  return (
    <>
      <VolunteerBrowserFilterButtonV2
        activeCount={selectedCount}
        label={label}
        totalCount={options.length}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      />
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {options.map((option) => (
          <MenuItem key={option.key} onClick={() => handleOptionClick(option)}>
            <Checkbox checked={option.selected} />
            <ListItemText primary={option.key} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
