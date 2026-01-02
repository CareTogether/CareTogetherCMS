import { useState } from 'react';
import {
  Autocomplete,
  Button,
  Drawer,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { ValidateDatePicker } from '../Generic/Forms/ValidateDatePicker';
import { FamilyName, familyNameString } from '../Families/FamilyName';
import { useLoadable } from '../Hooks/useLoadable';
import { partneringFamiliesData } from '../Model/V1CasesModel';
import {
  useV1ReferralsModel,
  referralsRefreshTrigger,
} from '../Model/V1ReferralsModel';
import { policyData } from '../Model/ConfigurationModel';
import { CustomField } from '../GeneratedClient';
import { CustomFieldInput } from '../Generic/CustomFieldInput';

interface AddNewReferralDrawerProps {
  onClose: () => void;
}

interface ReferralFields {
  openedAtLocal: Date;
  title: string;
  familyId: string | null;
  comment: string;
}

type CustomFieldValue = string | boolean | number | null | undefined;

export function AddNewReferralDrawer({ onClose }: AddNewReferralDrawerProps) {
  const families = useLoadable(partneringFamiliesData) || [];
  const policy = useRecoilValue(policyData);

  const { createReferral } = useV1ReferralsModel();
  const bumpRefresh = useSetRecoilState(referralsRefreshTrigger);

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

  const [fields, setFields] = useState<ReferralFields>({
    openedAtLocal: new Date(),
    title: '',
    familyId: null,
    comment: '',
  });

  const [customFieldValues, setCustomFieldValues] = useState<
    Record<string, CustomFieldValue>
  >({});

  const [dateError, setDateError] = useState(false);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof ReferralFields>(
    key: K,
    value: ReferralFields[K]
  ) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function updateCustomField(name: string, value: CustomFieldValue) {
    setCustomFieldValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function save() {
    if (saving || !fields.title || dateError) return;

    try {
      setSaving(true);

      await createReferral(crypto.randomUUID(), {
        familyId: fields.familyId,
        openedAtUtc: new Date(fields.openedAtLocal),
        title: fields.title,
        comment: fields.comment || undefined,
      });

      bumpRefresh((x) => x + 1);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const selectedFamily =
    familyOptions.find((o) => o.id === fields.familyId) ?? familyOptions[0];

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
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6">Open New Referral</Typography>
        </Grid>

        <Grid item xs={12}>
          <ValidateDatePicker
            label="When was this referral opened?"
            value={fields.openedAtLocal}
            disableFuture
            onChange={(date) => date && update('openedAtLocal', date)}
            onErrorChange={setDateError}
            textFieldProps={{ fullWidth: true, required: true }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Referral Title"
            fullWidth
            required
            value={fields.title}
            onChange={(e) => update('title', e.target.value)}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>Family</Typography>

          <Autocomplete
            fullWidth
            options={familyOptions}
            value={selectedFamily}
            getOptionLabel={(opt) => opt.label}
            onChange={(_, option) => update('familyId', option?.id ?? null)}
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
                    sx={{ fontWeight: 600, mb: 0.5 }}
                    className="ph-unmask"
                  >
                    {field.name}
                  </Typography>

                  <CustomFieldInput
                    customFieldPolicy={field}
                    value={customFieldValues[field.name!]}
                    onChange={(value) => updateCustomField(field.name!, value)}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>
        )}

        <Grid item xs={12}>
          <TextField
            label="Referral Comment"
            fullWidth
            multiline
            minRows={3}
            value={fields.comment}
            onChange={(e) => update('comment', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sx={{ textAlign: 'right' }}>
          <Button
            color="secondary"
            variant="contained"
            sx={{ mr: 2 }}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            color="primary"
            variant="contained"
            disabled={!fields.title || dateError || saving}
            onClick={save}
          >
            Save
          </Button>
        </Grid>
      </Grid>
    </Drawer>
  );
}
