import { useState } from 'react';
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
} from '@mui/material';
import { ReferralCloseReason as V1CaseCloseReason } from '../GeneratedClient';
import { UpdateDialog } from '../Generic/UpdateDialog';
import { DatePicker } from '@mui/x-date-pickers';
import { useV1CasesModel } from '../Model/V1CasesModel';

interface CloseV1CaseDialogProps {
  partneringFamilyId: string;
  v1CaseId: string;
  onClose: () => void;
}

export function CloseV1CaseDialog({
  partneringFamilyId,
  v1CaseId,
  onClose,
}: CloseV1CaseDialogProps) {
  const v1CasesModel = useV1CasesModel();
  const [fields, setFields] = useState({
    reason: null as V1CaseCloseReason | null,
    closedAtLocal: null as Date | null,
  });
  const { reason, closedAtLocal } = fields;

  async function save() {
    await v1CasesModel.closeV1Case(
      partneringFamilyId,
      v1CaseId,
      reason!,
      closedAtLocal!
    );
  }

  return (
    <UpdateDialog
      title={`Why is this V1 Case being closed?`}
      onClose={onClose}
      onSave={save}
      enableSave={() => reason != null && closedAtLocal != null}
    >
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Reason for Closing:</FormLabel>
              <RadioGroup
                aria-label="reason"
                name="reason"
                value={reason == null ? '' : V1CaseCloseReason[reason]}
                onChange={(e) =>
                  setFields({
                    ...fields,
                    reason:
                      V1CaseCloseReason[
                        e.target.value as keyof typeof V1CaseCloseReason
                      ],
                  })
                }
              >
                <FormControlLabel
                  value={V1CaseCloseReason[V1CaseCloseReason.NotAppropriate]}
                  control={<Radio size="small" />}
                  label="Not Appropriate"
                />
                <FormControlLabel
                  value={V1CaseCloseReason[V1CaseCloseReason.NoCapacity]}
                  control={<Radio size="small" />}
                  label="No Capacity"
                />
                <FormControlLabel
                  value={V1CaseCloseReason[V1CaseCloseReason.NoLongerNeeded]}
                  control={<Radio size="small" />}
                  label="No Longer Needed"
                />
                <FormControlLabel
                  value={V1CaseCloseReason[V1CaseCloseReason.Resourced]}
                  control={<Radio size="small" />}
                  label="Resourced"
                />
                <FormControlLabel
                  value={V1CaseCloseReason[V1CaseCloseReason.NeedMet]}
                  control={<Radio size="small" />}
                  label="Need Met"
                />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <DatePicker
              label="When was this V1 Case closed?"
              value={closedAtLocal}
              disableFuture
              format="MM/dd/yyyy"
              onChange={(date: Date | null) =>
                date && setFields({ ...fields, closedAtLocal: date })
              }
            />
          </Grid>
        </Grid>
      </form>
    </UpdateDialog>
  );
}
