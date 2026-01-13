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
import { CustomField, V1Referral } from '../GeneratedClient';
import { CustomFieldInput } from '../Generic/CustomFieldInput';

import {
  addReferralSchema,
  AddReferralFormValues,
} from '../V1Referrals/ReferralSchema';

interface EditReferralDrawerProps {
  referral: V1Referral;
  onClose: () => void;
}

export function EditReferralDrawer({
  referral,
  onClose,
}: EditReferralDrawerProps) {
  const families = useLoadable(partneringFamiliesData) || [];
  const policy = useRecoilValue(policyData);

  const { updateReferralDetails, updateCustomReferralField } =
    useV1ReferralsModel();

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
      openedAtLocal: referral.createdAtUtc,
      title: referral.title,
      familyId: referral.familyId ?? null,
      comment: referral.comment ?? '',
      customFields: Object.fromEntries(
        referralCustomFields.map((field) => [
          field.name,
          referral.completedCustomFields?.[field.name]?.value ?? undefined,
        ])
      ),
    },
  });

  const onSubmit = async (data: AddReferralFormValues) => {
    await updateReferralDetails(referral.referralId, {
      familyId: data.familyId,
      openedAtUtc: data.openedAtLocal,
      title: data.title,
      comment: data.comment || undefined,
    });

    for (const field of referralCustomFields) {
      const value = data.customFields?.[field.name];

      if (value !== undefined) {
        await updateCustomReferralField(referral.referralId, field, value);
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
            <Typography variant="h6">Edit Referral</Typography>
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

          {referralCustomFields.length > 0 && (
            <Grid item xs={12}>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Referral Details
              </Typography>

              <Grid container spacing={2}>
                {referralCustomFields.map((field) => (
                  <Grid item xs={12} key={field.name}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5 }}
                      className="ph-unmask"
                    >
                      {field.name}
                    </Typography>

                    <Controller
                      name={`customFields.${field.name}` as const}
                      control={control}
                      render={({ field: rhfField }) => (
                        <CustomFieldInput
                          customFieldPolicy={field}
                          value={rhfField.value}
                          onChange={rhfField.onChange}
                        />
                      )}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          )}

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
