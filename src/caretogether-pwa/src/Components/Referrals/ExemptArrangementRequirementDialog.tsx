import { useState } from 'react';
import { Grid, TextField } from '@material-ui/core';
import { UpdateDialog } from '../UpdateDialog';
import { KeyboardDatePicker } from '@material-ui/pickers';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { MissingArrangementRequirement } from '../../GeneratedClient';

interface ExemptArrangementRequirementDialogProps {
  partneringFamilyId: string,
  referralId: string,
  arrangementId: string,
  requirement: MissingArrangementRequirement,
  onClose: () => void
}

export function ExemptArrangementRequirementDialog({partneringFamilyId, referralId, arrangementId, requirement, onClose}: ExemptArrangementRequirementDialogProps) {
  const referralsModel = useReferralsModel();
  const [fields, setFields] = useState({
    additionalComments: "",
    exemptionExpiresAtLocal: null as Date | null
  });
  const { additionalComments, exemptionExpiresAtLocal } = fields;

  async function save() {
    await referralsModel.exemptArrangementRequirement(partneringFamilyId, referralId, arrangementId,
      requirement.actionName!, additionalComments, exemptionExpiresAtLocal);
  }

  return (
    <UpdateDialog title={`Exempt this arrangement from the ${requirement.actionName} requirement`} onClose={onClose}
      onSave={save} enableSave={() => additionalComments !== ""}>
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              id="additional-comments"
              label="Additional Comments" placeholder="Explain why the arrangement will be exempted from this requirement"
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
