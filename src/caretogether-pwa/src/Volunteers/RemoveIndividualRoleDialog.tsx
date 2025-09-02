import { useState } from 'react';
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material';
import { Person, RoleRemovalReason } from '../GeneratedClient';
import { useVolunteersModel } from '../Model/VolunteersModel';
import { UpdateDialog } from '../Generic/UpdateDialog';
import { useRecoilValue } from 'recoil';
import { policyData } from '../Model/ConfigurationModel';
import { ValidateDatePicker } from '../Generic/Forms/ValidateDatePicker';

interface RemoveIndividualRoleDialogProps {
  volunteerFamilyId: string;
  person: Person;
  role: string;
  onClose: () => void;
}

export function RemoveIndividualRoleDialog({
  volunteerFamilyId,
  person,
  role,
  onClose,
}: RemoveIndividualRoleDialogProps) {
  const volunteerFamiliesModel = useVolunteersModel();
  const [fields, setFields] = useState({
    reason: RoleRemovalReason.Inactive,
    additionalComments: '',
    effectiveSince: new Date() as Date | null,
    effectiveThrough: null as Date | null,
  });
  const { reason, additionalComments, effectiveSince, effectiveThrough } =
    fields;

  const [dateError, setDateError] = useState(false);

  const policy = useRecoilValue(policyData);
  const isFamilyRole =
    policy.volunteerPolicy?.volunteerFamilyRoles?.[role] != null;

  async function save() {
    await volunteerFamiliesModel.removeIndividualRole(
      volunteerFamilyId,
      person.id as string,
      role,
      reason,
      additionalComments,
      effectiveSince,
      effectiveThrough
    );
  }

  return (
    <UpdateDialog
      title={`Remove ${role} role for ${person.firstName} ${person.lastName}`}
      onClose={onClose}
      onSave={save}
      enableSave={() => additionalComments !== '' && !dateError}
    >
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Reason for Removal:</FormLabel>
              <RadioGroup
                aria-label="reason"
                name="reason"
                row
                value={RoleRemovalReason[reason]}
                onChange={(e) =>
                  setFields({
                    ...fields,
                    reason:
                      RoleRemovalReason[
                        e.target.value as keyof typeof RoleRemovalReason
                      ],
                  })
                }
              >
                <FormControlLabel
                  value={RoleRemovalReason[RoleRemovalReason.Inactive]}
                  control={<Radio size="small" />}
                  label="Inactive"
                />
                {isFamilyRole && (
                  // The 'opted out' reason is only applicable to family roles. Opting out of an individual role is just being inactive.
                  <FormControlLabel
                    value={RoleRemovalReason[RoleRemovalReason.OptOut]}
                    control={<Radio size="small" />}
                    label="Opted Out"
                  />
                )}
                <FormControlLabel
                  value={RoleRemovalReason[RoleRemovalReason.Denied]}
                  control={<Radio size="small" />}
                  label="Denied"
                />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              id="additional-comments"
              label="Additional Comments"
              placeholder="Explain why the volunteer is not going to serve in this role"
              multiline
              fullWidth
              variant="outlined"
              minRows={2}
              maxRows={5}
              size="small"
              value={additionalComments}
              onChange={(e) =>
                setFields({ ...fields, additionalComments: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12}>
            <ValidateDatePicker
              label="Effective Since (optional - leave blank to use the current date)"
              value={effectiveSince}
              disableFuture
              format="M/d/yyyy"
              onChange={(date) =>
                setFields({ ...fields, effectiveSince: date })
              }
              onErrorChange={setDateError}
              textFieldProps={{
                fullWidth: true,
              }}
            />
          </Grid>
        </Grid>
      </form>
    </UpdateDialog>
  );
}
