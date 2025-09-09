import { DialogContentText } from '@mui/material';
import { ExemptedRequirementInfo } from '../GeneratedClient';
import { useV1CasesModel } from '../Model/V1CasesModel';
import { useVolunteersModel } from '../Model/VolunteersModel';
import { DialogHandle } from '../Hooks/useDialogHandle';
import { UpdateDialog } from '../Generic/UpdateDialog';
import { RequirementContext } from './RequirementContext';

type ExemptedRequirementDialogProps = {
  handle: DialogHandle;
  requirement: ExemptedRequirementInfo;
  context: RequirementContext;
};
export function ExemptedRequirementDialog({
  handle,
  requirement,
  context,
}: ExemptedRequirementDialogProps) {
  const v1Cases = useV1CasesModel();
  const volunteers = useVolunteersModel();

  return (
    <UpdateDialog
      open={handle.open}
      onClose={handle.closeDialog}
      key={handle.key}
      title="Are you sure you want to remove the exemption for this requirement?"
      saveLabel="Yes, Remove Exemption"
      onSave={async () => {
        switch (context.kind) {
          case 'V1Case':
            await v1Cases.unexemptV1CaseRequirement(
              context.partneringFamilyId,
              context.v1CaseId,
              requirement
            );
            break;
          case 'Arrangement':
            await v1Cases.unexemptArrangementRequirement(
              context.partneringFamilyId,
              context.v1CaseId,
              context.arrangementId,
              requirement
            );
            break;
          case 'Family Volunteer Assignment':
            await v1Cases.unexemptVolunteerFamilyAssignmentRequirement(
              context.partneringFamilyId,
              context.v1CaseId,
              context.arrangementId,
              context.assignment,
              requirement
            );
            break;
          case 'Individual Volunteer Assignment':
            await v1Cases.unexemptIndividualVolunteerAssignmentRequirement(
              context.partneringFamilyId,
              context.v1CaseId,
              context.arrangementId,
              context.assignment,
              requirement
            );
            break;
          case 'Volunteer Family':
            await volunteers.unexemptVolunteerFamilyRequirement(
              context.volunteerFamilyId,
              requirement
            );
            break;
          case 'Individual Volunteer':
            await volunteers.unexemptVolunteerRequirement(
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
