import { DialogContentText } from '@mui/material';
import { ExemptedRequirementInfo } from '../GeneratedClient';
import { useReferralsModel } from '../Model/ReferralsModel';
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
  const referrals = useReferralsModel();
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
          case 'Referral':
            await referrals.unexemptReferralRequirement(
              context.partneringFamilyId,
              context.referralId,
              requirement
            );
            break;
          case 'Arrangement':
            await referrals.unexemptArrangementRequirement(
              context.partneringFamilyId,
              context.referralId,
              context.arrangementId,
              requirement
            );
            break;
          case 'Family Volunteer Assignment':
            await referrals.unexemptVolunteerFamilyAssignmentRequirement(
              context.partneringFamilyId,
              context.referralId,
              context.arrangementId,
              context.assignment,
              requirement
            );
            break;
          case 'Individual Volunteer Assignment':
            await referrals.unexemptIndividualVolunteerAssignmentRequirement(
              context.partneringFamilyId,
              context.referralId,
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
