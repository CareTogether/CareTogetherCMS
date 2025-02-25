import {
  Button,
  Grid,
  TextField,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { RoleDefinition } from '../../GeneratedClient';
import { useState } from 'react';
import { useBackdrop } from '../../Hooks/useBackdrop';
import { api } from '../../Api/Api';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { selectedLocationContextState } from '../../Model/Data';
import { organizationConfigurationEdited } from '../../Model/ConfigurationModel';

interface DrawerProps {
  onClose: () => void;
}

interface AddEditCommunityDrawerProps extends DrawerProps {}

export function AddRole({ onClose }: AddEditCommunityDrawerProps) {
  const [roleName, setRoleName] = useState('');
  const [isProtected, setIsProtected] = useState(false);

  const { organizationId } = useRecoilValue(selectedLocationContextState);

  const storeEdits = useSetRecoilState(organizationConfigurationEdited);

  const withBackdrop = useBackdrop();

  async function save() {
    await withBackdrop(async () => {
      const newConfig = await api.configuration.putRoleDefinition(
        organizationId!,
        roleName,
        new RoleDefinition({
          roleName,
          isProtected,
          permissionSets: [],
        })
      );

      storeEdits(newConfig);
      onClose();
    });
  }

  return (
    <Grid container spacing={2} maxWidth={500}>
      <Grid item xs={12}>
        <h3>Add New Role</h3>
      </Grid>

      <Grid item xs={12}>
        <TextField
          type="text"
          fullWidth
          required
          label="Name"
          placeholder="Enter a name for the community"
          error={roleName.length === 0}
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          autoFocus
        />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={isProtected}
              onChange={(e) => setIsProtected(e.target.checked)}
              color="primary"
            />
          }
          label="Is Protected"
        />
      </Grid>

      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        <Button
          color="secondary"
          variant="contained"
          sx={{ marginRight: 2 }}
          onClick={onClose}
        >
          Cancel
        </Button>

        <Button
          color="primary"
          variant="contained"
          disabled={roleName.length === 0}
          onClick={save}
        >
          Save
        </Button>
      </Grid>
    </Grid>
  );
}
