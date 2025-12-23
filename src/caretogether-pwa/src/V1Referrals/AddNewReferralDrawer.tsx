import { useState } from 'react';
import {
  Autocomplete,
  Button,
  Drawer,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { useSetRecoilState } from 'recoil';
import { ValidateDatePicker } from '../Generic/Forms/ValidateDatePicker';
import { FamilyName, familyNameString } from '../Families/FamilyName';
import { useLoadable } from '../Hooks/useLoadable';
import { partneringFamiliesData } from '../Model/V1CasesModel';
import {
  useV1ReferralsModel,
  referralsRefreshTrigger,
} from '../Model/V1ReferralsModel';

interface AddNewReferralDrawerProps {
  onClose: () => void;
}

interface ReferralFields {
  openedAtLocal: Date;
  title: string;
  familyId: string | null;
  comment: string;
}

export function AddNewReferralDrawer({ onClose }: AddNewReferralDrawerProps) {
  const families = useLoadable(partneringFamiliesData) || [];
  const { createReferral } = useV1ReferralsModel();
  const bumpRefresh = useSetRecoilState(referralsRefreshTrigger);

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

  const [dateError, setDateError] = useState(false);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof ReferralFields>(
    key: K,
    value: ReferralFields[K]
  ) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    if (saving || !fields.title || dateError) return;

    try {
      setSaving(true);

      const referralId = crypto.randomUUID();

      await createReferral(referralId, {
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
