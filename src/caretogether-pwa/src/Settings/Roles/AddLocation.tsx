import { Button, Grid, TextField, MenuItem } from '@mui/material';
import { useState } from 'react';
import { useBackdrop } from '../../Hooks/useBackdrop';
import { api } from '../../Api/Api';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { selectedLocationContextState } from '../../Model/Data';
import { organizationConfigurationEdited } from '../../Model/ConfigurationModel';
import { LocationConfiguration, TimeZoneInfo } from '../../GeneratedClient';

interface DrawerProps {
  onClose: () => void;
  availableTimezones: string[];
}

export function AddLocation({ onClose, availableTimezones }: DrawerProps) {
  const [locationName, setLocationName] = useState('');
  const [timezone, setTimezone] = useState('');

  const { organizationId } = useRecoilValue(selectedLocationContextState);
  const storeEdits = useSetRecoilState(organizationConfigurationEdited);
  const withBackdrop = useBackdrop();

  async function save() {
    await withBackdrop(async () => {
      const config = new LocationConfiguration({
        id: undefined,
        name: locationName,
        timeZone: new TimeZoneInfo({ id: timezone }),
      });

      const updated = await api.configuration.putLocationDefinition(
        organizationId!,
        undefined,
        config
      );

      storeEdits(updated);
      onClose();
    });
  }

  return (
    <Grid
      container
      spacing={2}
      maxWidth={500}
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <Grid item xs={12}>
        <h3>Add New Location</h3>
      </Grid>

      <Grid item xs={12}>
        <TextField
          type="text"
          fullWidth
          required
          label="Location Name"
          placeholder="Enter a name for the location"
          error={locationName.length === 0}
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          autoFocus
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          select
          fullWidth
          required
          label="Timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        >
          {availableTimezones.map((tz) => (
            <MenuItem key={tz} value={tz}>
              {tz}
            </MenuItem>
          ))}
        </TextField>
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
          disabled={locationName.length === 0 || timezone.length === 0}
        >
          Save
        </Button>
      </Grid>
    </Grid>
  );
}
