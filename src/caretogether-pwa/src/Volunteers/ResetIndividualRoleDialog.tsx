import { Person, RoleRemovalReason } from '../GeneratedClient';
import { useVolunteersModel } from '../Model/VolunteersModel';
import { UpdateDialog } from '../Generic/UpdateDialog';
import { Grid } from '@mui/material';
import { ValidateDatePicker } from '../Generic/Forms/ValidateDatePicker';
import { useState } from 'react';

interface ResetIndividualRoleDialogProps {
  volunteerFamilyId: string;
  person: Person;
  role: string;
  removalReason: RoleRemovalReason;
  removalAdditionalComments: string;
  onClose: () => void;
}

export function ResetIndividualRoleDialog({
  volunteerFamilyId,
  person,
  role,
  removalReason,
  removalAdditionalComments,
  onClose,
}: ResetIndividualRoleDialogProps) {
  const volunteerFamiliesModel = useVolunteersModel();
  const [fields, setFields] = useState({
    forRemovalEffectiveSince: null as Date | null,
    effectiveThrough: null as Date | null,
  });
  const { forRemovalEffectiveSince, effectiveThrough } = fields;

  const [dateError, setDateError] = useState(false);

  async function save() {
    await volunteerFamiliesModel.resetIndividualRole(
      volunteerFamilyId,
      person.id as string,
      role,
      forRemovalEffectiveSince,
      effectiveThrough
    );
  }

  return (
    <UpdateDialog
      title={`Do you want to reset the ${role} role for ${person.firstName} ${person.lastName}?`}
      onClose={onClose}
      onSave={save}
      enableSave={() => !dateError}
    >
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <p>
              The current status of this role is{' '}
              {RoleRemovalReason[removalReason]}. Additional comments were:
              <br />
              <i>{removalAdditionalComments}</i>
            </p>
          </Grid>
          <Grid item xs={12}>
            <ValidateDatePicker
              label="Effective Through (optional - leave blank to use the current date)"
              value={effectiveThrough}
              disableFuture
              minDate={new Date(1900, 0, 1)}
              format="M/d/yyyy"
              onChange={(date) =>
                setFields({ ...fields, effectiveThrough: date })
              }
              onErrorChange={setDateError}
              textFieldProps={{ fullWidth: true }}
            />
          </Grid>
        </Grid>
      </form>
    </UpdateDialog>
  );
}
