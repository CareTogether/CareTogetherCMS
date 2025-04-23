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
import { useEffect, useState } from 'react';
import { Arrangement, Referral } from '../../GeneratedClient';

export function ArrangementFilter({
  referral,
  onFiltered,
}: {
  referral: Referral | undefined;
  onFiltered: (filtered: Arrangement[]) => void;
  arrangementRefs: React.MutableRefObject<
    Record<string, HTMLDivElement | null>
  >;
}) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(['Active']);

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedOptions(typeof value === 'string' ? value.split(',') : value);
  };

  const getFilteredArrangements = (): Arrangement[] => {
    if (!referral?.arrangements) return [];

    return referral.arrangements.filter((arrangement) => {
      return selectedOptions.some((option) => {
        if (
          option === 'Active' &&
          !arrangement.cancelledAtUtc &&
          !arrangement.endedAtUtc
        )
          return true;
        if (option === 'Cancelled' && !!arrangement.cancelledAtUtc) return true;
        if (option === 'Ended' && !!arrangement.endedAtUtc) return true;
        return false;
      });
    });
  };

  useEffect(() => {
    const filtered = getFilteredArrangements();
    onFiltered(filtered);
  }, [referral, selectedOptions]);

  const filterOptions = [
    { key: 'Active', value: 'Active' },
    { key: 'Cancelled', value: 'Cancelled' },
    { key: 'Ended', value: 'Ended' },
  ];

  return (
    <FormControl sx={{ position: 'relative', minWidth: 160 }}>
      <Select
        multiple
        value={selectedOptions}
        onChange={handleChange}
        input={<InputBase />}
        IconComponent={FilterListIcon}
        renderValue={() => {
          return selectedOptions.length === filterOptions.length
            ? `All`
            : `${selectedOptions.length} of ${filterOptions.length}`;
        }}
        sx={{
          '.MuiSelect-icon': {
            right: 90,
          },
        }}
      >
        {filterOptions.map((option) => (
          <MenuItem key={option.key} value={option.value}>
            <Checkbox checked={selectedOptions.includes(option.value)} />
            <ListItemText primary={option.key} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
