import { DialogContentText } from '@mui/material';
import { CompletedRequirementInfo } from '../GeneratedClient';
import { useReferralsModel } from '../Model/ReferralsModel';
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
  const referrals = useReferralsModel();
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
          case 'Referral':
            await referrals.markReferralRequirementIncomplete(
              context.partneringFamilyId,
              context.referralId,
              requirement
            );
            break;
          case 'Arrangement':
            await referrals.markArrangementRequirementIncomplete(
              context.partneringFamilyId,
              context.referralId,
              context.arrangementId,
              requirement
            );
            break;
          case 'Family Volunteer Assignment':
            await referrals.markVolunteerFamilyAssignmentRequirementIncomplete(
              context.partneringFamilyId,
              context.referralId,
              context.arrangementId,
              context.assignment,
              requirement
            );
            break;
          case 'Individual Volunteer Assignment':
            await referrals.markIndividualVolunteerAssignmentRequirementIncomplete(
              context.partneringFamilyId,
              context.referralId,
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
