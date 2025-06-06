import { Autocomplete, TextField, Button, Stack } from '@mui/material';
import { Permission } from '../../GeneratedClient';
import { spacesBeforeCapitalLetters } from './spacesBeforeCapitalLetters';
import { useState } from 'react';

interface PermissionSelectProps {
  availablePermissions: [string, string | Permission][];
  onAdd: (permissions: Permission[]) => void;
}

type Option = {
  title: string;
  value: Permission;
};

export function PermissionsSelect({
  availablePermissions,
  onAdd,
}: PermissionSelectProps) {
  const [value, setValue] = useState<Option[]>([]);

  const options = availablePermissions.map(([name, value]) => ({
    title: spacesBeforeCapitalLetters(name),
    value: value as Permission,
  }));

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
        options={options}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        getOptionLabel={(option) => option.title}
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
