import { useRecoilValue } from 'recoil';
import { CloseReasonDrawer } from '../Generic/CloseReasonDrawer';
import { referralCloseReasonsData } from '../Model/ConfigurationModel';
import { useV1ReferralsModel } from '../Model/V1ReferralsModel';

interface CloseV1ReferralDrawerProps {
  referralId: string;
  onClose: () => void;
}

export function CloseV1ReferralDrawer({
  referralId,
  onClose,
}: CloseV1ReferralDrawerProps) {
  const { closeReferral } = useV1ReferralsModel();
  const referralCloseReasons = useRecoilValue(referralCloseReasonsData);

  async function closeCurrentReferral(reason: string, closedAtLocal: Date) {
    await closeReferral(referralId, reason, closedAtLocal);
    onClose();
  }

  return (
    <CloseReasonDrawer
      title="Why is this Referral being closed?"
      reasons={referralCloseReasons}
      dateLabel="When was this Referral closed?"
      saveLabel="Save"
      onClose={onClose}
      onSave={closeCurrentReferral}
    />
  );
}
