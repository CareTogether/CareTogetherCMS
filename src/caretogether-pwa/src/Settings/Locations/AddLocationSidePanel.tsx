import { Button, Grid, TextField, Typography } from '@mui/material';
import { useBackdrop } from '../../Hooks/useBackdrop';
import { api } from '../../Api/Api';
import {
  useRecoilRefresher_UNSTABLE,
  useRecoilValue,
  useSetRecoilState,
} from 'recoil';
import {
  selectedLocationContextState,
  userOrganizationAccessQuery,
} from '../../Model/Data';
import { organizationConfigurationEdited } from '../../Model/ConfigurationModel';
import {
  ApiException,
  LocationConfiguration,
  PutLocationPayload,
} from '../../GeneratedClient';
import { useForm, Controller } from 'react-hook-form';
import { useAppNavigate } from '../../Hooks/useAppNavigate';
import { useLoadable } from '../../Hooks/useLoadable';
import { organizationConfigurationQuery } from '../../Model/ConfigurationModel';
import MenuItem from '@mui/material/MenuItem';
import { useState } from 'react';

interface DrawerProps {
  onClose: () => void;
}

interface AddLocationFormValues {
  locationName: string;
  timeZone: string;
  copyPoliciesFromLocationId?: string;
}

export function AddLocation({ onClose }: DrawerProps) {
  const { organizationId, locationId } = useRecoilValue(
    selectedLocationContextState
  );
  const storeEdits = useSetRecoilState(organizationConfigurationEdited);
  const withBackdrop = useBackdrop();
  const appNavigate = useAppNavigate();
  const configuration = useLoadable(organizationConfigurationQuery);
  const refreshUserOrganizationAccess = useRecoilRefresher_UNSTABLE(
    userOrganizationAccessQuery
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<AddLocationFormValues>({
    mode: 'onChange',
    defaultValues: {
      locationName: '',
      timeZone: '',
      copyPoliciesFromLocationId: locationId || '',
    },
  });

  async function onSubmit(data: AddLocationFormValues) {
    await withBackdrop(async () => {
      try {
        const config = new LocationConfiguration({
          id: undefined,
          name: data.locationName,
          adultFamilyRelationships: [],
          arrangementReasons: [],
          ethnicities: [],
          smsSourcePhoneNumbers: [],
          accessLevels: [],
          timeZone: undefined, // TODO: Implement timezone
        });

        const updated = await api.configuration.putLocationDefinition(
          organizationId!,
          new PutLocationPayload({
            locationConfiguration: config,
            copyPoliciesFromLocationId: data.copyPoliciesFromLocationId,
          })
        );

        storeEdits(updated);

        const newLocation = updated.locations?.find(
          (location) => location.name === data.locationName
        );

        // Refresh the locations access so the user is able to switch to the new location
        refreshUserOrganizationAccess();

        if (newLocation?.id) {
          appNavigate.locationEdit(newLocation.id, {
            replaceLocationId: newLocation.id,
          });
        }
      } catch (error) {
        if (error instanceof ApiException) {
          setErrorMessage(error.response);
        } else if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage('An unexpected error occurred.');
        }
        throw error;
      }
    });
  }

  return (
    <Grid
      className="ph-unmask"
      container
      spacing={2}
      maxWidth={500}
      component="form"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Grid item xs={12}>
        <h3>Add New Location</h3>

        <Typography gutterBottom>
          When creating a new location, you can copy policies from an existing
          location. This will help you quickly set up the new location with
          similar policies.
        </Typography>

        <Typography>
          Keep in mind your family records will also be copied over to the new
          location.
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Controller
          name="locationName"
          control={control}
          rules={{ required: 'Location name is required' }}
          render={({ field }) => (
            <TextField
              {...field}
              type="text"
              fullWidth
              required
              label="Location Name"
              placeholder="Enter a name for the location"
              error={!!errors.locationName}
              helperText={errors.locationName?.message}
              autoFocus
            />
          )}
        />
      </Grid>
      <Grid item xs={12}>
        <Controller
          name="copyPoliciesFromLocationId"
          control={control}
          rules={{
            required: 'You must select a location to copy policies from',
          }}
          render={({ field }) => (
            <TextField
              {...field}
              select
              fullWidth
              required
              label="Copy policies from..."
              placeholder="Select a location to copy policies from"
              error={!!errors.copyPoliciesFromLocationId}
              helperText={errors.copyPoliciesFromLocationId?.message}
            >
              {configuration?.locations?.map((location) => (
                <MenuItem key={location.id} value={location.id}>
                  {location.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </Grid>
      {/* TODO: Implement timezone */}
      {/* <Grid item xs={12}>
        <Controller
          name="timeZone"
          control={control}
          rules={{ required: 'Timezone is required' }}
          render={({ field }) => (
            <TextField
              {...field}
              select
              fullWidth
              required
              label="Timezone"
              error={!!errors.timeZone}
              helperText={errors.timeZone?.message}
            >
              {availableTimezones.map((tz) => (
                <MenuItem key={tz} value={tz}>
                  {tz}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </Grid> */}
      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        {errorMessage && (
          <>
            <Typography color="error">
              Something went wrong while creating Location.
            </Typography>
            <Typography color="error" gutterBottom>
              Backend message: {errorMessage}
            </Typography>
          </>
        )}

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
          disabled={!isValid}
        >
          Save
        </Button>
      </Grid>
    </Grid>
  );
}
