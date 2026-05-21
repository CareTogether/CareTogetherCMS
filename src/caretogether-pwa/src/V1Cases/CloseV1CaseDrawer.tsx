import { useRecoilValue } from 'recoil';
import { CloseReasonDrawer } from '../Generic/CloseReasonDrawer';
import { caseCloseReasonsData } from '../Model/ConfigurationModel';
import { useV1CasesModel } from '../Model/V1CasesModel';

interface CloseV1CaseDrawerProps {
  partneringFamilyId: string;
  v1CaseId: string;
  onClose: () => void;
}

export function CloseV1CaseDrawer({
  partneringFamilyId,
  v1CaseId,
  onClose,
}: CloseV1CaseDrawerProps) {
  const v1CasesModel = useV1CasesModel();
  const caseCloseReasons = useRecoilValue(caseCloseReasonsData);

  async function closeCase(reason: string, closedAtLocal: Date) {
    await v1CasesModel.closeV1Case(
      partneringFamilyId,
      v1CaseId,
      reason,
      closedAtLocal
    );
    onClose();
  }

  return (
    <CloseReasonDrawer
      title="Why is this Case being closed?"
      reasons={caseCloseReasons}
      dateLabel="When was this Case closed?"
      saveLabel="Save"
      onClose={onClose}
      onSave={closeCase}
    />
  );
}
