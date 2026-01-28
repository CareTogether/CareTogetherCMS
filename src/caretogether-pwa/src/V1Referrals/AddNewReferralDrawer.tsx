import { Button, Drawer, Grid, TextField, Typography } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRecoilValue } from 'recoil';

import { ValidateDatePicker } from '../Generic/Forms/ValidateDatePicker';
import { useV1ReferralsModel } from '../Model/V1ReferralsModel';
import { policyData } from '../Model/ConfigurationModel';
import { CustomField } from '../GeneratedClient';
import {
  addReferralSchema,
  AddReferralFormValues,
} from '../V1Referrals/ReferralSchema';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { ReferralCustomFieldsSection } from '../V1Referrals/ReferralCustomFieldsSection';

interface AddNewReferralDrawerProps {
  onClose: () => void;
}

export function AddNewReferralDrawer({ onClose }: AddNewReferralDrawerProps) {
  const policy = useRecoilValue(policyData);
  const { createReferral, updateCustomReferralField } = useV1ReferralsModel();

  const referralCustomFields: CustomField[] =
    policy.referralPolicy?.customFields ?? [];

  const navigate = useAppNavigate();

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

    navigate.referral(referralId);
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

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              You can either add a new family, or choose one that already exists
              from the referral's page.
            </Typography>
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
