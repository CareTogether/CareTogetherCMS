import { Stack, TextField, Typography, Button } from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { CTAutocomplete } from '../../../Generic/Forms/CTAutocomplete';
import { api } from '../../../Api/Api';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { selectedLocationContextState } from '../../../Model/Data';
import {
  LocationConfiguration,
  PutLocationPayload,
  OrganizationConfiguration,
} from '../../../GeneratedClient';
import { organizationConfigurationEdited } from '../../../Model/ConfigurationModel';
import { useBackdrop } from '../../../Hooks/useBackdrop';

export type ConfigurationData = {
  name: string;
  // timeZone?: string;
  ethnicities: string[];
  adultFamilyRelationships: string[];
  arrangementReasons: string[];
  referralCloseReasons: string[];
};

export type AvailableOptions = {
  timezones: string[];
  ethnicities: string[];
  adultFamilyRelationships: string[];
  arrangementReasons: string[];
  referralCloseReasons: string[];
};

type Props = {
  data: ConfigurationData;
  currentLocationDefinition: LocationConfiguration;
};

export default function BasicConfiguration({
  data,
  currentLocationDefinition,
}: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    defaultValues: data,
  });

  const { organizationId } = useRecoilValue(selectedLocationContextState);
  const storeEdits = useSetRecoilState(organizationConfigurationEdited);
  const withBackdrop = useBackdrop();

  const onSubmit: SubmitHandler<ConfigurationData> = async (data) => {
    withBackdrop(async () => {
      const { referralCloseReasons, ...locationData } = data;

      const updatedOrgConfig = await api.configuration.putLocationDefinition(
        organizationId,
        new PutLocationPayload({
          locationConfiguration: new LocationConfiguration({
            ...currentLocationDefinition,
            ...locationData,
          }),
        })
      );

      storeEdits(
        new OrganizationConfiguration({
          ...updatedOrgConfig,
          referralCloseReasons,
        })
      );
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Basic configuration
      </Typography>

      <Stack direction="column" spacing={3} alignItems="stretch">
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Controller
            name="name"
            control={control}
            rules={{
              required: true,
            }}
            render={({ field }) => (
              <TextField
                label="Location name"
                error={errors[field.name] !== undefined}
                helperText={errors[field.name]?.message}
                required
                size="small"
                {...field}
              />
            )}
          />

          {/* <TextField
            label="Timezone"
            select
            // value={localData.timezone}
            // onChange={(e) => handleChange('timezone', e.target.value)}
            helperText="This affects date calculations throughout the app"
          >
            {options.timezones.map((tz) => (
              <MenuItem key={tz} value={tz}>
                {tz}
              </MenuItem>
            ))}
          </TextField> */}
        </Stack>
        <Typography variant="h6">Ethnicities</Typography>
        <Typography variant="body2">
          Here’s where you can update the list of ethnicities.
          <br /> These options will be available when creating or editing a
          family member. <br /> You can add new ones or remove ones you don’t
          need anymore, it won’t change any existing records.
        </Typography>

        <CTAutocomplete
          name="ethnicities"
          label="Ethnicities"
          freeSolo
          control={control}
          helperText='Start typing and press "Enter" to add a new item'
          minTypingAreaWidth={120}
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

        <CTAutocomplete
          name="adultFamilyRelationships"
          label="Family relationship types"
          freeSolo
          control={control}
          helperText='Start typing and press "Enter" to add a new item'
          minTypingAreaWidth={120}
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

        <CTAutocomplete
          name="arrangementReasons"
          label="Arrangement reasons"
          freeSolo
          control={control}
          helperText='Start typing and press "Enter" to add a new item'
          minTypingAreaWidth={120}
        />

        <Typography variant="h6">Referral close reasons</Typography>

        <Typography variant="body2">
          Here you can customize the list of reasons for closing referrals.
          <br />
          These options will be available when closing a referral across the
          organization.
          <br />
          You can add new ones or remove ones you don’t need anymore, it won’t
          change any existing records.
        </Typography>

        <CTAutocomplete
          name="referralCloseReasons"
          label="Referral close reasons"
          freeSolo
          control={control}
          helperText='Start typing and press "Enter" to add a new item'
          minTypingAreaWidth={120}
        />

        <Stack direction="row" spacing={2} justifyContent="flex-start">
          <Button
            variant="contained"
            color="secondary"
            onClick={() => reset()}
            disabled={!isDirty}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={!isDirty}
          >
            Save
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
