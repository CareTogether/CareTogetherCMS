import { useState } from 'react';
import { FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, TextField } from '@mui/material';
import { RoleRemovalReason } from '../GeneratedClient';
import { useVolunteersModel } from '../Model/VolunteersModel';
import { UpdateDialog } from '../Generic/UpdateDialog';

interface RemoveFamilyRoleDialogProps {
  volunteerFamilyId: string,
  role: string,
  onClose: () => void
}

export function RemoveFamilyRoleDialog({volunteerFamilyId, role, onClose}: RemoveFamilyRoleDialogProps) {
  const volunteerFamiliesModel = useVolunteersModel();
  const [fields, setFields] = useState({
    reason: RoleRemovalReason.Inactive,
    additionalComments: ""
  });
  const { reason, additionalComments } = fields;

  async function save() {
    await volunteerFamiliesModel.removeFamilyRole(volunteerFamilyId,
      role, reason, additionalComments);
  }

  return (
    <UpdateDialog title={`Remove ${role} role for this family`} onClose={onClose}
      onSave={save} enableSave={() => additionalComments !== ""}>
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Reason for Removal:</FormLabel>
              <RadioGroup aria-label="reason" name="reason" row
                value={RoleRemovalReason[reason]} onChange={e => setFields({...fields, reason: RoleRemovalReason[e.target.value as keyof typeof RoleRemovalReason]})}>
                <FormControlLabel value={RoleRemovalReason[RoleRemovalReason.Inactive]} control={<Radio size="small" />} label="Inactive" />
                <FormControlLabel value={RoleRemovalReason[RoleRemovalReason.OptOut]} control={<Radio size="small" />} label="Opted Out" />
                <FormControlLabel value={RoleRemovalReason[RoleRemovalReason.Denied]} control={<Radio size="small" />} label="Denied" />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              id="additional-comments"
              label="Additional Comments" placeholder="Explain why the family is not going to serve in this role"
              multiline fullWidth variant="outlined" minRows={2} maxRows={5} size="small"
              value={additionalComments} onChange={e => setFields({...fields, additionalComments: e.target.value})}
            />
          </Grid>
        </Grid>
      </form>
    </UpdateDialog>
  );
}
