import { useMemo, useState } from 'react';
import {
  Autocomplete,
  Button,
  Drawer,
  Grid,
  TextField,
  Typography,
} from '@mui/material';

export interface FamilyOption {
  id: string;
  label: string;
}

interface SelectReferralFamilyDrawerProps {
  open: boolean;
  working?: boolean;
  familyOptions: FamilyOption[];
  onCancel: () => void;
  onSave: (familyId: string) => void;
}

export function SelectReferralFamilyDrawer({
  open,
  working = false,
  familyOptions,
  onCancel,
  onSave,
}: SelectReferralFamilyDrawerProps) {
  const [selected, setSelected] = useState<FamilyOption | null>(null);

  const canSave = useMemo(
    () => !!selected?.id && !working,
    [selected, working]
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onCancel}
      PaperProps={{ sx: { width: 500, p: 3, top: 45 } }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (selected?.id) onSave(selected.id);
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">Select Family</Typography>
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              options={familyOptions}
              getOptionLabel={(opt) => opt.label}
              value={selected}
              onChange={(_, option) => setSelected(option)}
              disabled={working}
              renderInput={(params) => (
                <TextField {...params} label="Family" fullWidth />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              After selecting and saving a family, it cannot be edited or
              removed from this referral.
            </Typography>
          </Grid>

          <Grid item xs={12} sx={{ textAlign: 'right' }}>
            <Button
              color="secondary"
              variant="contained"
              sx={{ mr: 2 }}
              onClick={onCancel}
              disabled={working}
            >
              Cancel
            </Button>

            <Button
              color="primary"
              variant="contained"
              type="submit"
              disabled={!canSave}
            >
              Save
            </Button>
          </Grid>
        </Grid>
      </form>
    </Drawer>
  );
}
