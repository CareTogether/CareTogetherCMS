import { CloseReasonDrawer } from '../Generic/CloseReasonDrawer';
import { useReferralCloseReasons } from '../Model/ConfigurationModel';
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
  const referralCloseReasons = useReferralCloseReasons() ?? [];

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
