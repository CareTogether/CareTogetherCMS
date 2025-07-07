import {
  Button,
  Grid,
  TextField,
  Checkbox,
  FormControlLabel,
  FormHelperText,
  FormControl,
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

interface AddEditRoleDrawerProps extends DrawerProps {}

export function AddRole({ onClose }: AddEditRoleDrawerProps) {
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
    <div className="ph-unmask">
      <Grid
        container
        spacing={2}
        maxWidth={500}
        component="form" // This allows easier editing & submitting via the keyboard
        onSubmit={(event) => {
          // Avoids a page reload
          event.preventDefault();
          save();
        }}
      >
        <Grid item xs={12}>
          <h3>Add New Role</h3>
        </Grid>

        <Grid item xs={12}>
          <TextField
            type="text"
            fullWidth
            required
            label="Name"
            placeholder="Enter a name for the role"
            error={roleName.length === 0}
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            autoFocus
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isProtected}
                  onChange={(e) => setIsProtected(e.target.checked)}
                  color="primary"
                />
              }
              label="Protected"
            />
            <FormHelperText>
              Protected roles are roles that can only be assigned to or removed
              from users by a user who has a role with the "Edit Person User
              Protected Roles" permission. Use protected roles for the most
              sensitive roles in your organization, typically staff roles.
            </FormHelperText>
          </FormControl>
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
            type="submit"
            color="primary"
            variant="contained"
            disabled={roleName.length === 0}
          >
            Save
          </Button>
        </Grid>
      </Grid>
    </div>
  );
}
