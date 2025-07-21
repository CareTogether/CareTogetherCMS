import { Button, Grid, TextField } from '@mui/material';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { api } from '../../../../Api/Api';
import {
  AccessLevel,
  LocationConfiguration,
  PutLocationPayload,
} from '../../../../GeneratedClient';
import { useBackdrop } from '../../../../Hooks/useBackdrop';
import {
  locationConfigurationQuery,
  organizationConfigurationEdited,
  organizationConfigurationQuery,
} from '../../../../Model/ConfigurationModel';
import { selectedLocationContextState } from '../../../../Model/Data';
import { CTAutocomplete } from '../../../../Generic/Forms/CTAutocomplete';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';

export type AccessLevelData = {
  id?: string;
  name: string;
  organizationRoles: string[];
};

interface DrawerProps {
  onClose: () => void;
}

interface AddAccessLevelDrawerProps extends DrawerProps {
  data?: AccessLevelData;
}

export function AddAccessLevel({ data, onClose }: AddAccessLevelDrawerProps) {
  const {
    control,
    formState: { isDirty },
    handleSubmit,
  } = useForm({
    defaultValues: {
      id: data?.id || undefined,
      name: data?.name || '',
      organizationRoles: data?.organizationRoles || [],
    },
  });

  const organization = useRecoilValue(organizationConfigurationQuery);
  const location = useRecoilValue(locationConfigurationQuery);

  const { organizationId } = useRecoilValue(selectedLocationContextState);

  const storeEdits = useSetRecoilState(organizationConfigurationEdited);

  const withBackdrop = useBackdrop();

  const save: SubmitHandler<AccessLevelData> = async (data) => {
    await withBackdrop(async () => {
      const newLocationConfiguration = new LocationConfiguration(location);

      // Remove any existing access level with the same name
      const filteredAccessLevels = (location?.accessLevels || []).filter(
        (al: AccessLevel) => al.id !== data.id
      );

      newLocationConfiguration.accessLevels = [
        ...filteredAccessLevels,
        new AccessLevel({
          id: data.id,
          name: data.name,
          organizationRoles: data.organizationRoles,
          approvalRoles: [],
        }),
      ];

      const newConfig = await api.configuration.putLocationDefinition(
        organizationId!,
        new PutLocationPayload({
          locationConfiguration: newLocationConfiguration,
        })
      );

      storeEdits(newConfig);
      onClose();
    });
  };

  return (
    <Grid
      container
      spacing={2}
      maxWidth={500}
      component="form" // This allows easier editing & submitting via the keyboard
      onSubmit={handleSubmit(save)}
    >
      <Grid item xs={12}>
        <h3>Add New Access Level</h3>
      </Grid>

      <Grid item xs={12}>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              type="text"
              fullWidth
              required
              label="Name"
              placeholder="Enter a name for the access level"
              autoFocus
              {...field}
            />
          )}
        ></Controller>
      </Grid>

      <Grid item xs={12}>
        <CTAutocomplete
          name="organizationRoles"
          label="Organization Roles"
          fullWidth
          control={control}
          options={organization?.roles?.map(({ roleName }) => roleName!) || []}
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
          type="submit"
          color="primary"
          variant="contained"
          disabled={!isDirty}
        >
          Save
        </Button>
      </Grid>
    </Grid>
  );
}
