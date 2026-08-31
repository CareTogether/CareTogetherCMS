import Grid from '../../Generic/GridLegacyCompat';
import { useState } from 'react';
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material';
import {
  ArrangementPolicy,
  Arrangement,
  ArrangementFunction,
} from '../../GeneratedClient';
import { useParams } from 'react-router-dom';
import { useBackdrop } from '../../Hooks/useBackdrop';
import { DialogHandle } from '../../Hooks/useDialogHandle';
import { useV1CasesModel } from '../../Model/V1CasesModel';
import { isBackdropClick } from '../../Utilities/handleBackdropClick';
import { useArrangementFunctionCandidateAssignees } from './useArrangementFunctionCandidateAssignees';

interface AssignArrangementFunctionDialogProps {
  handle: DialogHandle;
  v1CaseId: string;
  arrangement: Arrangement;
  arrangementPolicy: ArrangementPolicy;
  arrangementFunction: ArrangementFunction;
}

interface AssigneeOptionType {
  label: string;
  id: string;
  candidateType: string;
}

export function AssignArrangementFunctionDialog({
  handle,
  v1CaseId,
  arrangement,
  arrangementFunction,
}: AssignArrangementFunctionDialogProps) {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;

  const candidateAssignees = useArrangementFunctionCandidateAssignees({
    arrangement,
    arrangementFunction,
    missingPrimaryContactFamilyName: '\u26a0 MISSING PRIMARY CONTACT Family',
  });

  const [fields, setFields] = useState({
    assigneeKey: '',
    variant: null as string | null,
  });
  const { assigneeKey } = fields;

  const v1CasesModel = useV1CasesModel();

  const withBackdrop = useBackdrop();

  async function save() {
    await withBackdrop(async () => {
      handle.closeDialog(); // This is placed here so values are not recalculated unnecessarily (which otherwise results in errors).
      const assigneeInfo = candidateAssignees.find(
        (ca) => ca.key === assigneeKey
      );
      if (assigneeInfo?.personId == null) {
        await v1CasesModel.assignVolunteerFamily(
          familyId,
          v1CaseId,
          arrangement.id!,
          assigneeInfo!.familyId,
          arrangementFunction.functionName!,
          fields.variant || undefined
        );
      } else {
        await v1CasesModel.assignIndividualVolunteer(
          familyId,
          v1CaseId,
          arrangement.id!,
          assigneeInfo!.familyId,
          assigneeInfo!.personId,
          arrangementFunction.functionName!,
          fields.variant || undefined
        );
      }
      //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
    });
  }

  return (
    <Dialog
      maxWidth={'xs'}
      fullWidth={true}
      open={handle.open}
      onClose={(_, reason: string) =>
        !isBackdropClick(reason) ? handle.closeDialog : {}
      }
      key={handle.key}
      aria-labelledby="assign-volunteer-title"
      sx={{ '& .MuiDialog-paperFullWidth': { overflowY: 'visible' } }}
    >
      <DialogTitle id="assign-volunteer-title" sx={{ paddingBottom: '20px' }}>
        Assign {arrangementFunction.functionName}
      </DialogTitle>
      <DialogContent
        sx={{ '& .MuiDialogContent-root': { overflowY: 'visible' } }}
      >
        <form noValidate autoComplete="off">
          <Grid container spacing={2}>
            {arrangementFunction.variants &&
              arrangementFunction.variants.length > 0 && (
                <Grid item xs={12}>
                  <FormControl required>
                    <FormLabel id="variant">Variant</FormLabel>
                    <RadioGroup
                      aria-labelledby="variant"
                      value={fields.variant}
                      onChange={(event) =>
                        setFields({
                          ...fields,
                          variant: (event.target as HTMLInputElement).value,
                        })
                      }
                    >
                      {arrangementFunction.variants.map((variant) => (
                        <FormControlLabel
                          key={variant.variantName}
                          value={variant.variantName}
                          control={<Radio />}
                          label={variant.variantName!}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                </Grid>
              )}
            <Grid item xs={12}>
              <FormControl
                required
                fullWidth
                size="small"
                sx={{ marginTop: 1 }}
              >
                <Autocomplete
                  id="assignee"
                  clearOnEscape
                  onChange={(_event, newValue: AssigneeOptionType | null) => {
                    setFields({
                      ...fields,
                      assigneeKey: newValue?.id as string,
                    });
                  }}
                  options={candidateAssignees
                    .map((candidate) => {
                      return {
                        label: candidate.displayName,
                        id: candidate.key,
                        candidateType: candidate.candidateType,
                      };
                    })
                    .sort(
                      (a, b) => -b.candidateType.localeCompare(a.candidateType)
                    )}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  groupBy={(option) => option.candidateType}
                  sx={{ width: 400 }}
                  renderInput={(params) => (
                    <TextField
                      required
                      {...params}
                      label="Select a family or individual to assign"
                    />
                  )}
                />
              </FormControl>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions sx={{ paddingRight: '20px', paddingBottom: '20px' }}>
        <Button onClick={handle.closeDialog} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={save}
          variant="contained"
          color="primary"
          disabled={
            assigneeKey?.length === 0 ||
            (arrangementFunction.variants &&
              arrangementFunction.variants.length > 0 &&
              fields.variant == null)
          }
        >
          Assign
        </Button>
      </DialogActions>
    </Dialog>
  );
}
