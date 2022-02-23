import { ExemptedRequirementInfo } from '../../GeneratedClient';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { UpdateDialog } from '../UpdateDialog';

interface UnexemptArrangementRequirementDialogProps {
  partneringFamilyId: string,
  referralId: string,
  arrangementId: string,
  exemptedRequirement: ExemptedRequirementInfo,
  onClose: () => void
}

export function UnexemptArrangementRequirementDialog({partneringFamilyId, referralId, arrangementId, exemptedRequirement, onClose}: UnexemptArrangementRequirementDialogProps) {
  const referralsModel = useReferralsModel();

  async function save() {
    await referralsModel.unexemptArrangementRequirement(partneringFamilyId, referralId, arrangementId,
      exemptedRequirement);
  }

  return (
    <UpdateDialog title={`Reinstate the ${exemptedRequirement.requirementName} requirement for this arrangement`} onClose={onClose}
      onSave={save}>
      <p>Are you sure you want to remove the exemption for this requirement?</p>
    </UpdateDialog>
  );
}
