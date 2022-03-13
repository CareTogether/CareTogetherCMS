import { DialogContentText } from "@mui/material";
import { CompletedRequirementInfo } from "../../GeneratedClient";
import { useReferralsModel } from "../../Model/ReferralsModel";
import { useVolunteersModel } from "../../Model/VolunteersModel";
import { UpdateDialog } from "../UpdateDialog";
import { RequirementContext } from "./RequirementContext";

type CompletedRequirementDialogProps = {
  open: boolean;
  onClose: () => void;
  requirement: CompletedRequirementInfo;
  context: RequirementContext;
};
export function CompletedRequirementDialog({
  open, onClose, requirement, context
}: CompletedRequirementDialogProps) {
  const referrals = useReferralsModel();
  const volunteers = useVolunteersModel();

  return (
    <UpdateDialog open={open} onClose={onClose}
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
