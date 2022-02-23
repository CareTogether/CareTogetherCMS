import { ExemptedRequirementInfo } from '../../GeneratedClient';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { UpdateDialog } from '../UpdateDialog';

interface UnexemptReferralRequirementDialogProps {
  partneringFamilyId: string,
  referralId: string,
  exemptedRequirement: ExemptedRequirementInfo,
  onClose: () => void
}

export function UnexemptReferralRequirementDialog({partneringFamilyId, referralId, exemptedRequirement, onClose}: UnexemptReferralRequirementDialogProps) {
  const referralsModel = useReferralsModel();

  async function save() {
    await referralsModel.unexemptReferralRequirement(partneringFamilyId, referralId,
      exemptedRequirement.requirementName!);
  }

  return (
    <UpdateDialog title={`Reinstate the ${exemptedRequirement.requirementName} requirement for this referral`} onClose={onClose}
      onSave={save}>
      <p>Are you sure you want to remove the exemption for this requirement?</p>
    </UpdateDialog>
  );
}
