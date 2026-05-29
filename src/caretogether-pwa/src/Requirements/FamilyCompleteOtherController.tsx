import { useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { Permission } from '../GeneratedClient';
import { policyData } from '../Model/ConfigurationModel';
import { VolunteerFamilyContext } from '../Requirements/RequirementContext';
import { useDialogHandle } from '../Hooks/useDialogHandle';
import { CompleteOtherDialog } from '../Requirements/CompleteOtherDialog';
import { MissingRequirementDialog } from '../Requirements/MissingRequirementDialog';
import { useFamilyIdPermissions } from '../Model/SessionModel';

type FamilyCompleteOtherControllerProps = {
  familyId: string;
  open: boolean;
  onClose: () => void;
};

export function FamilyCompleteOtherController({
  familyId,
  open,
  onClose,
}: FamilyCompleteOtherControllerProps) {
  const policy = useRecoilValue(policyData);
  const permissions = useFamilyIdPermissions(familyId);
  const requirementDialogHandle = useDialogHandle();
  const canComplete = permissions(Permission.EditApprovalRequirementCompletion);
  const canExempt = permissions(Permission.EditApprovalRequirementExemption);

  const [selectedRequirement, setSelectedRequirement] = useState<string | null>(
    null
  );

  const context: VolunteerFamilyContext = useMemo(
    () => ({
      kind: 'Volunteer Family',
      volunteerFamilyId: familyId,
    }),
    [familyId]
  );

  const selectedPolicy = useMemo(() => {
    if (!selectedRequirement) return undefined;

    const direct = policy.actionDefinitions[selectedRequirement];
    if (direct) return direct;

    return Object.values(policy.actionDefinitions).find((def) =>
      def.alternateNames?.includes(selectedRequirement)
    );
  }, [selectedRequirement, policy]);

  function handleSelectAction(actionName: string) {
    setSelectedRequirement(actionName);
    requirementDialogHandle.openDialog();
  }

  function handleCloseRequirement() {
    setSelectedRequirement(null);
    requirementDialogHandle.closeDialog();
    onClose();
  }
  function handleCloseChooser() {
    onClose();
  }

  return (
    <>
      <CompleteOtherDialog
        open={open}
        onClose={handleCloseChooser}
        onSelectAction={handleSelectAction}
      />

      {requirementDialogHandle.open &&
        selectedRequirement &&
        selectedPolicy && (
          <MissingRequirementDialog
            key={requirementDialogHandle.key}
            handle={{
              ...requirementDialogHandle,
              closeDialog: handleCloseRequirement,
            }}
            requirement={selectedRequirement}
            context={context}
            policy={selectedPolicy}
            canComplete={canComplete}
            canExempt={canExempt}
          />
        )}
    </>
  );
}
