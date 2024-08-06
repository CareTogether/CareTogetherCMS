import { FilterAlt } from '@mui/icons-material';
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  IconButton,
  Popover,
} from '@mui/material';
import React, { ChangeEvent, useState } from 'react';
import { IFilterOption } from './IFilterOption';

export interface IFilterMenuButtonProps {
  singularLabel: string;
  pluralLabel: string;
  filterOptions: IFilterOption[];
  handleFilterChange: (
    event: ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => void;
}

export function FilterMenu({
  singularLabel,
  pluralLabel,
  filterOptions,
  handleFilterChange,
}: IFilterMenuButtonProps) {
  const [filterElement, setFilterElement] = useState<HTMLButtonElement | null>(
    null
  );
  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterElement(event.currentTarget);
  };
  const handleFilterClose = () => {
    setFilterElement(null);
  };

  const filterIsOpen = Boolean(filterElement);
  const filterMenuId = filterIsOpen ? `${singularLabel}Filter` : undefined;

  return (
    <React.Fragment>
      <IconButton
        aria-describedby={filterMenuId}
        onClick={handleFilterClick}
        size="small"
        color="primary"
      >
        <FilterAlt />
      </IconButton>
      <Popover
        id={filterMenuId}
        open={filterIsOpen}
        anchorEl={filterElement}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <FormControl sx={{ m: 3 }} component="fieldset" variant="standard">
          <FormLabel component="legend">{`Filter ${pluralLabel}`}</FormLabel>
          <FormGroup>
            {filterOptions.map((o) => (
              <FormControlLabel
                key={o.key}
                control={
                  <Checkbox
                    checked={o.selected}
                    onChange={handleFilterChange}
                    name={o.text}
                  />
                }
                label={o.text}
              />
            ))}
          </FormGroup>
        </FormControl>
      </Popover>
    </React.Fragment>
  );
}
