import { Stack } from '@mui/material';
import { Permission } from '../GeneratedClient';
import { useFamilyIdPermissions } from '../Model/SessionModel';
import type { ApprovalLedgerOccurrence } from '../Approvals/approvalLedgerViewModel';
import type { ApprovalRequirementManagementMode } from '../Approvals/approvalDetails';
import { ApprovalManagementDrawer } from '../Approvals/ApprovalManagementDrawer';
import { ApprovalWorkflowConfirmationSectionV2 } from '../Approvals/ApprovalWorkflowConfirmationSectionV2';
import { ApprovalWorkflowMissingSectionV2 } from './ApprovalWorkflowMissingSectionV2';
import { useApprovalWorkflowActionsV2 } from './hooks/useApprovalWorkflowActionsV2';

export type RequirementManagementMode = ApprovalRequirementManagementMode;

type RequirementManagementDrawerV2Props = {
  mode: RequirementManagementMode | null;
  occurrence: ApprovalLedgerOccurrence | undefined;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

function familyIdFromOccurrence(
  occurrence: ApprovalLedgerOccurrence | undefined
) {
  if (
    occurrence?.context.kind === 'Volunteer Family' ||
    occurrence?.context.kind === 'Individual Volunteer'
  ) {
    return occurrence.context.volunteerFamilyId;
  }

  return '';
}

export function RequirementManagementDrawerV2({
  mode,
  occurrence,
  open,
  onClose,
  onSuccess,
}: RequirementManagementDrawerV2Props) {
  const permissions = useFamilyIdPermissions(
    familyIdFromOccurrence(occurrence)
  );
  const onWorkflowSuccess = onSuccess ?? onClose;
  const approvalWorkflowActions = useApprovalWorkflowActionsV2(
    mode === 'markIncomplete' || mode === 'removeExemption'
      ? occurrence
      : undefined,
    onWorkflowSuccess
  );

  return (
    <ApprovalManagementDrawer
      titleId="requirement-management-title"
      mode={mode}
      occurrence={occurrence}
      open={open}
      onClose={onClose}
    >
      {occurrence && mode && (
        <Stack spacing={2}>
          {(mode === 'complete' || mode === 'grantExemption') && (
            <ApprovalWorkflowMissingSectionV2
              occurrence={occurrence}
              context={occurrence.context}
              canComplete={
                mode === 'complete' &&
                permissions(Permission.EditApprovalRequirementCompletion)
              }
              canExempt={
                mode === 'grantExemption' &&
                permissions(Permission.EditApprovalRequirementExemption)
              }
              mode={mode}
              onSuccess={onWorkflowSuccess}
            />
          )}

          {mode === 'markIncomplete' && (
            <ApprovalWorkflowConfirmationSectionV2
              title="Mark Incomplete"
              description="This will move the requirement back to missing so it can be completed again."
              buttonLabel="Mark Incomplete"
              confirmationTitle="Mark requirement incomplete?"
              confirmationDescription="This will remove the completed status and move this requirement back to missing so it can be completed again."
              disabled={!approvalWorkflowActions.canMarkIncomplete}
              loading={approvalWorkflowActions.loading}
              onConfirm={approvalWorkflowActions.markIncomplete}
            />
          )}

          {mode === 'removeExemption' && (
            <ApprovalWorkflowConfirmationSectionV2
              title="Remove Exemption"
              description="This will remove the exemption and make this requirement needed again."
              buttonLabel="Remove Exemption"
              confirmationTitle="Remove this exemption?"
              confirmationDescription="This will remove the exemption and make this requirement needed again for approval."
              disabled={!approvalWorkflowActions.canRemoveExemption}
              loading={approvalWorkflowActions.loading}
              onConfirm={approvalWorkflowActions.removeExemption}
            />
          )}
        </Stack>
      )}
    </ApprovalManagementDrawer>
  );
}
