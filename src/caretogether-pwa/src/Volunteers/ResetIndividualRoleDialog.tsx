import { Person, RoleRemovalReason } from '../GeneratedClient';
import { useVolunteersModel } from '../Model/VolunteersModel';
import { UpdateDialog } from '../Generic/UpdateDialog';
import { Grid } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useState } from 'react';

interface ResetIndividualRoleDialogProps {
  volunteerFamilyId: string,
  person: Person,
  role: string,
  removalReason: RoleRemovalReason,
  removalAdditionalComments: string,
  onClose: () => void
}

export function ResetIndividualRoleDialog({ volunteerFamilyId, person, role, removalReason, removalAdditionalComments, onClose }: ResetIndividualRoleDialogProps) {
  const volunteerFamiliesModel = useVolunteersModel();
  const [fields, setFields] = useState({
    forRemovalEffectiveSince: null as Date | null,
    effectiveThrough: null as Date | null
  });
  const { forRemovalEffectiveSince, effectiveThrough } = fields;

  async function save() {
    await volunteerFamiliesModel.resetIndividualRole(volunteerFamilyId, person.id as string,
      role, forRemovalEffectiveSince, effectiveThrough);
  }

  return (
    <UpdateDialog title={`Do you want to reset the ${role} role for ${person.firstName} ${person.lastName}?`} onClose={onClose}
      onSave={save}>
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <p>
              The current status of this role is {RoleRemovalReason[removalReason]}. Additional comments were:
              <br />
              <i>{removalAdditionalComments}</i>
            </p>
          </Grid>
          <Grid item xs={12}>
            <DatePicker
              label="Effective Through (optional - leave blank to use the current date)"
              value={effectiveThrough || null}
              disableFuture format="M/d/yyyy"
              onChange={(date: Date | null) => setFields({ ...fields, effectiveThrough: date })}
              slotProps={{ textField: { fullWidth: true } }} />
          </Grid>
        </Grid>
      </form>
    </UpdateDialog>
  );
}
