import { DialogContentText } from "@mui/material";
import { CompletedRequirementInfo } from "../GeneratedClient";
import { useReferralsModel } from "../Model/ReferralsModel";
import { useVolunteersModel } from "../Model/VolunteersModel";
import { DialogHandle } from "../useDialogHandle";
import { UpdateDialog } from "../UpdateDialog";
import { RequirementContext } from "./RequirementContext";

type CompletedRequirementDialogProps = {
  handle: DialogHandle
  requirement: CompletedRequirementInfo
  context: RequirementContext
};
export function CompletedRequirementDialog({
  handle, requirement, context
}: CompletedRequirementDialogProps) {
  const referrals = useReferralsModel();
  const volunteers = useVolunteersModel();

  return (
    <UpdateDialog open={handle.open} onClose={handle.closeDialog} key={handle.key}
      title="Are you sure you want to mark this step as incomplete?"
      saveLabel="Yes, Mark Incomplete"
      onSave={async () => {
        switch (context.kind) {
          case 'Referral':
            return referrals.markReferralRequirementIncomplete(
              context.partneringFamilyId, context.referralId, requirement);
          case 'Arrangement':
            return referrals.markArrangementRequirementIncomplete(
              context.partneringFamilyId, context.referralId, context.arrangementId, requirement);
          case 'Family Volunteer Assignment':
            return referrals.markVolunteerFamilyAssignmentRequirementIncomplete(
              context.partneringFamilyId, context.referralId, context.arrangementId, context.assignment, requirement);
          case 'Individual Volunteer Assignment':
            return referrals.markIndividualVolunteerAssignmentRequirementIncomplete(
              context.partneringFamilyId, context.referralId, context.arrangementId, context.assignment, requirement);
          case 'Volunteer Family':
            return volunteers.markFamilyRequirementIncomplete(
              context.volunteerFamilyId, requirement);
          case 'Individual Volunteer':
            return volunteers.markIndividualRequirementIncomplete(
              context.volunteerFamilyId, context.personId, requirement);
        }
      }}>
      <DialogContentText>{`${context.kind} Requirement: ${requirement.requirementName}`}</DialogContentText>
    </UpdateDialog>
  );
}
