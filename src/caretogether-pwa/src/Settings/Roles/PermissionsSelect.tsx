import { Autocomplete, TextField, Button, Stack } from '@mui/material';
import { Permission } from '../../GeneratedClient';
import { spacesBeforeCapitalLetters } from './spacesBeforeCapitalLetters';
import { useState } from 'react';
import { groupedPermissions } from './groupedPermissions';

interface PermissionSelectProps {
  availablePermissions: [string, string | Permission][];
  onAdd: (permissions: Permission[]) => void;
}

type Option = {
  title: string;
  value: Permission;
  group: string;
};

export function PermissionsSelect({
  availablePermissions,
  onAdd,
}: PermissionSelectProps) {
  const [value, setValue] = useState<Option[]>([]);

  // Build options with group labels using GroupedPermissions
  const groupedOptions: Option[] = Object.entries(groupedPermissions).flatMap(
    ([group, permissions]) =>
      permissions
        .map((permission) => {
          const found = availablePermissions.find(
            ([, value]) => Number(value) === permission
          );

          return found
            ? {
                title: spacesBeforeCapitalLetters(found[0]),
                value: found[1],
                group,
              }
            : null;
        })
        .filter((item): item is Option => item !== null)
  );

  return (
    <Stack mt={1} direction="row" spacing={1} alignItems="center">
      <Autocomplete
        sx={{ mt: 1, flexGrow: 1 }}
        fullWidth
        size="small"
        multiple
        value={value}
        onChange={(_, newValue: Option[]) => setValue(newValue)}
        id="tags-outlined"
        options={groupedOptions}
        groupBy={(option) => option.group}
        getOptionLabel={(option) => option.title}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        filterSelectedOptions
        renderInput={(params) => (
          <TextField
            {...params}
            label="Add Permissions"
            placeholder="Start typing to search..."
          />
        )}
      />

      <Button
        variant="contained"
        disabled={!value.length}
        onClick={() => {
          onAdd(value.map((v) => v.value));
          setValue([]);
        }}
      >
        Add
      </Button>
    </Stack>
  );
}
