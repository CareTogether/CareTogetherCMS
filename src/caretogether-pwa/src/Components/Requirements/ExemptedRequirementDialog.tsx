import { DialogContentText } from "@mui/material";
import { ExemptedRequirementInfo } from "../../GeneratedClient";
import { useReferralsModel } from "../../Model/ReferralsModel";
import { useVolunteersModel } from "../../Model/VolunteersModel";
import { DialogHandle } from "../../useDialogHandle";
import { UpdateDialog } from "../UpdateDialog";
import { RequirementContext } from "./RequirementContext";

type ExemptedRequirementDialogProps = {
  handle: DialogHandle
  requirement: ExemptedRequirementInfo
  context: RequirementContext
};
export function ExemptedRequirementDialog({
  handle, requirement, context
}: ExemptedRequirementDialogProps) {
  const referrals = useReferralsModel();
  const volunteers = useVolunteersModel();

  return (
    <UpdateDialog open={handle.open} onClose={handle.closeDialog} key={handle.key}
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
