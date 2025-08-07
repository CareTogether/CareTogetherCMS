import { DialogContentText } from '@mui/material';
import { CompletedRequirementInfo } from '../GeneratedClient';
import { useV1CasesModel } from '../Model/V1CasesModel';
import { useVolunteersModel } from '../Model/VolunteersModel';
import { DialogHandle } from '../Hooks/useDialogHandle';
import { UpdateDialog } from '../Generic/UpdateDialog';
import { RequirementContext } from './RequirementContext';

type CompletedRequirementDialogProps = {
  handle: DialogHandle;
  requirement: CompletedRequirementInfo;
  context: RequirementContext;
};
export function CompletedRequirementDialog({
  handle,
  requirement,
  context,
}: CompletedRequirementDialogProps) {
  const v1Cases = useV1CasesModel();
  const volunteers = useVolunteersModel();

  return (
    <UpdateDialog
      open={handle.open}
      onClose={handle.closeDialog}
      key={handle.key}
      title="Are you sure you want to mark this step as incomplete?"
      saveLabel="Yes, Mark Incomplete"
      onSave={async () => {
        switch (context.kind) {
          case 'V1Case':
            await v1Cases.markV1CaseRequirementIncomplete(
              context.partneringFamilyId,
              context.v1CaseId,
              requirement
            );
            break;
          case 'Arrangement':
            await v1Cases.markArrangementRequirementIncomplete(
              context.partneringFamilyId,
              context.v1CaseId,
              context.arrangementId,
              requirement
            );
            break;
          case 'Family Volunteer Assignment':
            await v1Cases.markVolunteerFamilyAssignmentRequirementIncomplete(
              context.partneringFamilyId,
              context.v1CaseId,
              context.arrangementId,
              context.assignment,
              requirement
            );
            break;
          case 'Individual Volunteer Assignment':
            await v1Cases.markIndividualVolunteerAssignmentRequirementIncomplete(
              context.partneringFamilyId,
              context.v1CaseId,
              context.arrangementId,
              context.assignment,
              requirement
            );
            break;
          case 'Volunteer Family':
            await volunteers.markFamilyRequirementIncomplete(
              context.volunteerFamilyId,
              requirement
            );
            break;
          case 'Individual Volunteer':
            await volunteers.markIndividualRequirementIncomplete(
              context.volunteerFamilyId,
              context.personId,
              requirement
            );
            break;
        }
      }}
    >
      <DialogContentText>{`${context.kind} Requirement: ${requirement.requirementName}`}</DialogContentText>
    </UpdateDialog>
  );
}
