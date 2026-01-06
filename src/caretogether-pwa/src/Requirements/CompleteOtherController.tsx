import { useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { policyData } from '../Model/ConfigurationModel';
import { IndividualVolunteerContext } from '../Requirements/RequirementContext';
import { useDialogHandle } from '../Hooks/useDialogHandle';
import { CompleteOtherDialog } from '../Requirements/CompleteOtherDialog';
import { MissingRequirementDialog } from '../Requirements/MissingRequirementDialog';

type CompleteOtherControllerProps = {
  familyId: string;
  personId: string;
  open: boolean;
  onClose: () => void;
};

export function CompleteOtherController({
  familyId,
  personId,
  open,
  onClose,
}: CompleteOtherControllerProps) {
  const policy = useRecoilValue(policyData);
  const requirementDialogHandle = useDialogHandle();

  const [selectedRequirement, setSelectedRequirement] = useState<string | null>(
    null
  );

  const context: IndividualVolunteerContext = useMemo(
    () => ({
      kind: 'Individual Volunteer',
      volunteerFamilyId: familyId,
      personId,
    }),
    [familyId, personId]
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

  return (
    <>
      <CompleteOtherDialog
        open={open}
        onClose={() => {}}
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
            canExempt={true}
          />
        )}
    </>
  );
}
