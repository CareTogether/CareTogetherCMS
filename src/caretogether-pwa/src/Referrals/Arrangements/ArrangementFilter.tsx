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
import { useEffect, useState, useCallback } from 'react';
import { Arrangement, Referral } from '../../GeneratedClient';

type ArrangementFilterProps = {
  referral?: Referral;
  onFiltered: (arrangements: Arrangement[]) => void;
  arrangementRefs: React.MutableRefObject<
    Record<string, HTMLDivElement | null>
  >;
};

export function ArrangementFilter({
  referral,
  onFiltered,
}: ArrangementFilterProps) {
  const filterOptions = ['Active', 'Cancelled', 'Ended'];
  const [selectedOptions, setSelectedOptions] = useState<string[]>(['Active']);

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    setSelectedOptions(event.target.value as string[]);
  };

  const getFilteredArrangements = useCallback(() => {
    return (referral?.arrangements || [])
      .filter((arrangement) => {
        if (selectedOptions.length === 0) return true;

        return selectedOptions.some((status) => {
          if (
            status === 'Active' &&
            !arrangement.cancelledAtUtc &&
            !arrangement.endedAtUtc
          )
            return true;
          if (status === 'Cancelled' && arrangement.cancelledAtUtc) return true;
          if (status === 'Ended' && arrangement.endedAtUtc) return true;
          return false;
        });
      })
      .sort((a, b) => {
        const aStart = a.startedAtUtc?.getTime() || 0;
        const bStart = b.startedAtUtc?.getTime() || 0;
        const aRequested = a.requestedAtUtc?.getTime() || 0;
        const bRequested = b.requestedAtUtc?.getTime() || 0;

        return bStart - aStart || bRequested - aRequested;
      });
  }, [referral, selectedOptions]);

  useEffect(() => {
    onFiltered(getFilteredArrangements());
  }, [getFilteredArrangements, onFiltered]);

  return (
    <FormControl sx={{ position: 'relative', minWidth: 160 }}>
      <Select
        multiple
        value={selectedOptions}
        onChange={handleChange}
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
