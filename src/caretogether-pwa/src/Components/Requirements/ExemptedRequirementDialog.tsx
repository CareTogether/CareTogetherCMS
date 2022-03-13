import { DialogContentText } from "@mui/material";
import { ExemptedRequirementInfo } from "../../GeneratedClient";
import { useReferralsModel } from "../../Model/ReferralsModel";
import { useVolunteersModel } from "../../Model/VolunteersModel";
import { UpdateDialog } from "../UpdateDialog";
import { RequirementContext } from "./RequirementContext";

type ExemptedRequirementDialogProps = {
  open: boolean;
  onClose: () => void;
  requirement: ExemptedRequirementInfo;
  context: RequirementContext;
};
export function ExemptedRequirementDialog({
  open, onClose, requirement, context
}: ExemptedRequirementDialogProps) {
  const referrals = useReferralsModel();
  const volunteers = useVolunteersModel();

  return (
    <UpdateDialog open={open} onClose={onClose}
      title="Are you sure you want to remove the exemption for this requirement?"
      saveLabel="Yes, Remove Exemption"
      onSave={async () => {
        switch (context.kind) {
          case 'Referral':
            return referrals.unexemptReferralRequirement(
              context.partneringFamilyId, context.referralId, requirement);
          case 'Arrangement':
            return referrals.unexemptArrangementRequirement(
              context.partneringFamilyId, context.referralId, context.arrangementId, requirement);
          case 'Volunteer Family':
            return volunteers.unexemptVolunteerFamilyRequirement(
              context.volunteerFamilyId, requirement);
          case 'Individual Volunteer':
            return volunteers.unexemptVolunteerRequirement(
              context.volunteerFamilyId, context.personId, requirement);
        }
      }}>
      <DialogContentText>{`${context.kind} Requirement: ${requirement.requirementName}`}</DialogContentText>
    </UpdateDialog>
  );
}
