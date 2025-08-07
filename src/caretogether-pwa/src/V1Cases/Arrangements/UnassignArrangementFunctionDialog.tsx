import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  ArrangementPolicy,
  Arrangement,
  ArrangementFunction,
  Person,
  FamilyVolunteerAssignment,
  IndividualVolunteerAssignment,
} from '../../GeneratedClient';
import { useBackdrop } from '../../Hooks/useBackdrop';
import { DialogHandle } from '../../Hooks/useDialogHandle';
import { useV1CasesModel } from '../../Model/V1CasesModel';
import { useFamilyLookup, usePersonLookup } from '../../Model/DirectoryModel';
import { PersonName } from '../../Families/PersonName';
import { FamilyName } from '../../Families/FamilyName';
import { isBackdropClick } from '../../Utilities/handleBackdropClick';

interface UnassignArrangementFunctionDialogProps {
  handle: DialogHandle;
  partneringFamilyId: string;
  v1CaseId: string;
  arrangement: Arrangement;
  arrangementPolicy: ArrangementPolicy;
  arrangementFunction: ArrangementFunction;
  assignment: FamilyVolunteerAssignment | IndividualVolunteerAssignment;
}

export function UnassignArrangementFunctionDialog({
  handle,
  partneringFamilyId,
  v1CaseId,
  arrangement,
  arrangementFunction,
  assignment,
}: UnassignArrangementFunctionDialogProps) {
  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();

  const assignee =
    assignment instanceof IndividualVolunteerAssignment
      ? personLookup(assignment.familyId, assignment.personId)
      : familyLookup(assignment.familyId);

  const v1CasesModel = useV1CasesModel();

  const withBackdrop = useBackdrop();

  async function save() {
    await withBackdrop(async () => {
      if (assignment instanceof IndividualVolunteerAssignment) {
        await v1CasesModel.unassignIndividualVolunteer(
          partneringFamilyId,
          v1CaseId,
          arrangement.id!,
          assignment.familyId!,
          assignment.personId!,
          arrangementFunction.functionName!,
          assignment.arrangementFunctionVariant
        );
      } else {
        await v1CasesModel.unassignVolunteerFamily(
          partneringFamilyId,
          v1CaseId,
          arrangement.id!,
          assignment.familyId!,
          arrangementFunction.functionName!,
          assignment.arrangementFunctionVariant
        );
      }
      //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
      handle.closeDialog();
    });
  }

  return (
    <Dialog
      open={handle.open}
      onClose={(_, reason: string) =>
        !isBackdropClick(reason) ? handle.closeDialog : {}
      }
      key={handle.key}
      scroll="body"
      aria-labelledby="assign-volunteer-title"
    >
      <DialogTitle id="assign-volunteer-title">
        Unassign {arrangementFunction.functionName}
      </DialogTitle>
      <DialogContent>
        <p>
          {assignee instanceof Person ? (
            <PersonName person={assignee} />
          ) : (
            <FamilyName family={assignee} />
          )}
        </p>
      </DialogContent>
      <DialogActions>
        <Button onClick={handle.closeDialog} color="secondary">
          Cancel
        </Button>
        <Button onClick={save} variant="contained" color="primary">
          Unassign
        </Button>
      </DialogActions>
    </Dialog>
  );
}
