import {
  Autocomplete,
  Button,
  Drawer,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRecoilValue } from 'recoil';

import { ValidateDatePicker } from '../Generic/Forms/ValidateDatePicker';
import { FamilyName, familyNameString } from '../Families/FamilyName';
import { useLoadable } from '../Hooks/useLoadable';
import { partneringFamiliesData } from '../Model/V1CasesModel';
import { useV1ReferralsModel } from '../Model/V1ReferralsModel';
import { policyData } from '../Model/ConfigurationModel';
import { CustomField } from '../GeneratedClient';
import {
  addReferralSchema,
  AddReferralFormValues,
} from '../V1Referrals/ReferralSchema';

import { ReferralCustomFieldsSection } from '../V1Referrals/ReferralCustomFieldsSection';

interface AddNewReferralDrawerProps {
  onClose: () => void;
}

export function AddNewReferralDrawer({ onClose }: AddNewReferralDrawerProps) {
  const families = useLoadable(partneringFamiliesData) || [];
  const policy = useRecoilValue(policyData);
  const { createReferral, updateCustomReferralField } = useV1ReferralsModel();

  const referralCustomFields: CustomField[] =
    policy.referralPolicy?.customFields ?? [];

  const familyOptions = [
    { id: null, label: 'Family Not Yet Known', family: null },
    ...families.map((f) => ({
      id: f.family?.id ?? null,
      label: familyNameString(f),
      family: f,
    })),
  ];

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<AddReferralFormValues>({
    resolver: zodResolver(addReferralSchema),
    defaultValues: {
      openedAtLocal: new Date(),
      title: '',
      familyId: null,
      comment: '',
      customFields: {},
    },
  });

  const onSubmit = async (data: AddReferralFormValues) => {
    const referralId = crypto.randomUUID();

    await createReferral(referralId, {
      familyId: data.familyId,
      openedAtUtc: data.openedAtLocal,
      title: data.title,
      comment: data.comment || undefined,
    });

    for (const customField of referralCustomFields) {
      const value = data.customFields?.[customField.name];

      if (value !== undefined && value !== null && value !== '') {
        await updateCustomReferralField(referralId, customField, value);
      }
    }

    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 500,
          p: 3,
          top: 45,
        },
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">Open New Referral</Typography>
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="openedAtLocal"
              control={control}
              render={({ field, fieldState }) => (
                <ValidateDatePicker
                  label="When was this referral opened?"
                  value={field.value}
                  disableFuture
                  onChange={(date) => field.onChange(date)}
                  textFieldProps={{
                    fullWidth: true,
                    required: true,
                    error: !!fieldState.error,
                    helperText: fieldState.error?.message,
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="title"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Referral Title"
                  fullWidth
                  required
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>Family</Typography>

            <Controller
              name="familyId"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  fullWidth
                  options={familyOptions}
                  value={
                    familyOptions.find((o) => o.id === field.value) ??
                    familyOptions[0]
                  }
                  getOptionLabel={(opt) => opt.label}
                  onChange={(_, option) => field.onChange(option?.id ?? null)}
                  renderOption={(props, option) => (
                    <li {...props}>
                      {option.family ? (
                        <FamilyName family={option.family} />
                      ) : (
                        option.label
                      )}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Family" />
                  )}
                />
              )}
            />
          </Grid>

          <ReferralCustomFieldsSection
            customFields={referralCustomFields}
            control={control}
            namePrefix="customFields"
          />

          <Grid item xs={12}>
            <Controller
              name="comment"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Referral Comment"
                  fullWidth
                  multiline
                  minRows={3}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sx={{ textAlign: 'right' }}>
            <Button
              color="secondary"
              variant="contained"
              sx={{ mr: 2 }}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              color="primary"
              variant="contained"
              type="submit"
              disabled={isSubmitting}
            >
              Save
            </Button>
          </Grid>
        </Grid>
      </form>
    </Drawer>
  );
}
