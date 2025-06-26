import {
  Chip,
  MenuItem,
  Stack,
  TextField,
  Autocomplete,
  Typography,
  Button,
} from '@mui/material';
import { useEffect, useState } from 'react';

export type ConfigurationData = {
  locationName: string;
  timezone: string;
  ethnicities: string[];
  familyRelationships: string[];
  arrangementReasons: string[];
};

export type AvailableOptions = {
  timezones: string[];
  ethnicities: string[];
  familyRelationships: string[];
  arrangementReasons: string[];
};

type Props = {
  data: ConfigurationData;
  options: AvailableOptions;
  setDirty: (dirty: boolean) => void;
  onChange: <K extends keyof Omit<ConfigurationData, 'locationName'>>(
    key: K,
    value: ConfigurationData[K]
  ) => void;
  onSave: () => void;
  onCancel: () => void;
};

export default function BasicConfiguration({
  data,
  options,
  setDirty,
  onChange,
  onSave,
  onCancel,
}: Props) {
  const [localData, setLocalData] = useState(data);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleChange = <
    K extends keyof Omit<ConfigurationData, 'locationName'>,
  >(
    key: K,
    value: ConfigurationData[K]
  ) => {
    setLocalData((prev) => ({ ...prev, [key]: value }));
    onChange(key, value);
    setDirty(true);
  };

  return (
    <>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Basic configuration
      </Typography>

      <Stack direction="column" spacing={3} alignItems="stretch">
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <TextField
            type="text"
            required
            label="Location name"
            value={localData.locationName}
            disabled
          />

          <TextField
            label="Timezone"
            select
            value={localData.timezone}
            onChange={(e) => handleChange('timezone', e.target.value)}
            helperText="This affects date calculations throughout the app"
          >
            {options.timezones.map((tz) => (
              <MenuItem key={tz} value={tz}>
                {tz}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <Typography variant="h6">Ethnicities</Typography>
        <Typography variant="body2">
          Here’s where you can update the list of ethnicities.
          <br /> These options will be available when creating or editing a
          family member. <br /> You can add new ones or remove ones you don’t
          need anymore, it won’t change any existing records.
        </Typography>

        <Autocomplete
          multiple
          freeSolo
          options={options.ethnicities}
          value={localData.ethnicities}
          onChange={(_, newValue) => handleChange('ethnicities', newValue)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                variant="outlined"
                label={option}
                {...getTagProps({ index })}
              />
            ))
          }
          renderInput={(params) => (
            <TextField {...params} label="Ethnicities" />
          )}
          fullWidth
        />

        <Typography variant="h6">Family relationship types</Typography>
        <Typography variant="body2">
          Use this section to manage the types of adult relationships.
          <br />
          These options will be available when creating or editing a family
          member.
          <br />
          You can add new ones or remove ones you don’t need anymore, it won’t
          change any existing records.
        </Typography>

        <Autocomplete
          multiple
          freeSolo
          options={options.familyRelationships}
          value={localData.familyRelationships}
          onChange={(_, newValue) =>
            handleChange('familyRelationships', newValue)
          }
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                variant="outlined"
                label={option}
                {...getTagProps({ index })}
              />
            ))
          }
          renderInput={(params) => (
            <TextField {...params} label="Family relationship types" />
          )}
          fullWidth
        />

        <Typography variant="h6">Arrangement reasons</Typography>
        <Typography variant="body2">
          Here you can customize the list of reasons for adult arrangements.
          <br />
          These options will be available when creating or editing an
          arrangement.
          <br />
          You can add new ones or remove ones you don’t need anymore, it won’t
          change any existing records.
        </Typography>

        <Autocomplete
          multiple
          freeSolo
          options={options.arrangementReasons}
          value={localData.arrangementReasons}
          onChange={(_, newValue) =>
            handleChange('arrangementReasons', newValue)
          }
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                variant="outlined"
                label={option}
                {...getTagProps({ index })}
              />
            ))
          }
          renderInput={(params) => (
            <TextField {...params} label="Arrangement reasons" />
          )}
          fullWidth
        />

        <Stack direction="row" spacing={2} justifyContent="flex-start">
          <Button variant="contained" color="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={onSave}>
            Save
          </Button>
        </Stack>
      </Stack>
    </>
  );
}
