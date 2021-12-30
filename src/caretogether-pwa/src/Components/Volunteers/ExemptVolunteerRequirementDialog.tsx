import { useState } from 'react';
import { Grid, TextField } from '@material-ui/core';
import { useVolunteersModel } from '../../Model/VolunteersModel';
import { UpdateDialog } from '../UpdateDialog';
import { KeyboardDatePicker } from '@material-ui/pickers';

interface ExemptVolunteerRequirementDialogProps {
  volunteerFamilyId: string,
  personId: string,
  requirementName: string,
  onClose: () => void
}

export function ExemptVolunteerRequirementDialog({volunteerFamilyId, personId, requirementName, onClose}: ExemptVolunteerRequirementDialogProps) {
  const volunteerFamiliesModel = useVolunteersModel();
  const [fields, setFields] = useState({
    additionalComments: "",
    exemptionExpiresAtLocal: null as Date | null
  });
  const { additionalComments, exemptionExpiresAtLocal } = fields;

  async function save() {
    await volunteerFamiliesModel.exemptVolunteerRequirement(volunteerFamilyId, personId,
      requirementName, additionalComments, exemptionExpiresAtLocal);
  }

  return (
    <UpdateDialog title={`Exempt this person from the ${requirementName} requirement`} onClose={onClose}
      onSave={save} enableSave={() => additionalComments !== ""}>
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              id="additional-comments"
              label="Additional Comments" placeholder="Explain why this individual will be exempted from this requirement"
              multiline fullWidth variant="outlined" minRows={2} maxRows={5} size="small"
              value={additionalComments} onChange={e => setFields({...fields, additionalComments: e.target.value})}
            />
          </Grid>
          <Grid item xs={12}>
            <KeyboardDatePicker
              label="When does this exemption expire? (Default is never)"
              value={exemptionExpiresAtLocal} fullWidth
              format="MM/dd/yyyy"
              onChange={(date) => date && setFields({...fields, exemptionExpiresAtLocal: date })}
              showTodayButton />
          </Grid>
        </Grid>
      </form>
    </UpdateDialog>
  );
}
