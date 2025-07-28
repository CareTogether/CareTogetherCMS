import { Button, Grid, TextField } from '@mui/material';
import { useBackdrop } from '../../Hooks/useBackdrop';
import { api } from '../../Api/Api';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { selectedLocationContextState } from '../../Model/Data';
import { organizationConfigurationEdited } from '../../Model/ConfigurationModel';
import { LocationConfiguration } from '../../GeneratedClient';
import { useForm, Controller } from 'react-hook-form';
import { useAppNavigate } from '../../Hooks/useAppNavigate';

interface DrawerProps {
  onClose: () => void;
}

interface AddLocationFormValues {
  locationName: string;
  timeZone: string;
}

export function AddLocation({ onClose }: DrawerProps) {
  const { organizationId } = useRecoilValue(selectedLocationContextState);
  const storeEdits = useSetRecoilState(organizationConfigurationEdited);
  const withBackdrop = useBackdrop();
  const appNavigate = useAppNavigate();

  const {
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<AddLocationFormValues>({
    mode: 'onChange',
    defaultValues: { locationName: '', timeZone: '' },
  });

  async function onSubmit(data: AddLocationFormValues) {
    await withBackdrop(async () => {
      const config = new LocationConfiguration({
        id: undefined,
        name: data.locationName,
        adultFamilyRelationships: [],
        arrangementReasons: [],
        ethnicities: [],
        smsSourcePhoneNumbers: [],
        timeZone: undefined, // TODO: Implement timezone
      });
      const updated = await api.configuration.putLocationDefinition(
        organizationId!,
        config
      );
      storeEdits(updated);
      // Find the new location's id from the updated locations list (typed)
      const newLocation = updated.locations?.find(
        (location) => location.name === data.locationName
      );
      if (newLocation?.id) {
        appNavigate.locationEdit(newLocation.id);
      }
      onClose();
    });
  }

  return (
    <Grid
      container
      spacing={2}
      maxWidth={500}
      component="form"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Grid item xs={12}>
        <h3>Add New Location</h3>
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
