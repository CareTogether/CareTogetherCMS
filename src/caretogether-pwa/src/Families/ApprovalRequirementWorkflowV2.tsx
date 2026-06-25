import { Typography } from '@mui/material';
import { Permission } from '../GeneratedClient';
import { useFamilyIdPermissions } from '../Model/SessionModel';
import type { ApprovalLedgerOccurrence } from './approvalLedgerViewModel';
import { ApprovalWorkflowConfirmationSectionV2 } from './ApprovalWorkflowConfirmationSectionV2';
import { ApprovalWorkflowMissingSectionV2 } from './ApprovalWorkflowMissingSectionV2';
import { useApprovalWorkflowActionsV2 } from './hooks/useApprovalWorkflowActionsV2';

type ApprovalRequirementWorkflowV2Props = {
  occurrence: ApprovalLedgerOccurrence | undefined;
  onSuccess?: () => void;
};

function familyIdFromOccurrence(occurrence: ApprovalLedgerOccurrence | undefined) {
  if (
    occurrence?.context.kind === 'Volunteer Family' ||
    occurrence?.context.kind === 'Individual Volunteer'
  ) {
    return occurrence.context.volunteerFamilyId;
  }

  return '';
}

export function ApprovalRequirementWorkflowV2({
  occurrence,
  onSuccess,
}: ApprovalRequirementWorkflowV2Props) {
  const permissions = useFamilyIdPermissions(familyIdFromOccurrence(occurrence));
  const approvalWorkflowActions = useApprovalWorkflowActionsV2(
    occurrence?.status === 'completed' || occurrence?.status === 'exempted'
      ? occurrence
      : undefined,
    onSuccess
  );

  if (!occurrence) {
    return null;
  }

  if (
    occurrence.status === 'missing' ||
    occurrence.status === 'availableApplication'
  ) {
    return (
      <ApprovalWorkflowMissingSectionV2
        occurrence={occurrence}
        context={occurrence.context}
        canComplete={permissions(Permission.EditApprovalRequirementCompletion)}
        canExempt={permissions(Permission.EditApprovalRequirementExemption)}
        onSuccess={onSuccess}
      />
    );
  }

  if (occurrence.status === 'completed') {
    return (
      <ApprovalWorkflowConfirmationSectionV2
        title="Mark Incomplete"
        description="This will move the requirement back to missing so it can be completed again."
        warningText="This action changes the approval status immediately."
        buttonLabel="Mark Incomplete"
        disabled={!approvalWorkflowActions.canMarkIncomplete}
        loading={approvalWorkflowActions.loading}
        onConfirm={approvalWorkflowActions.markIncomplete}
      />
    );
  }

  if (occurrence.status === 'exempted') {
    return (
      <ApprovalWorkflowConfirmationSectionV2
        title="Remove Exemption"
        description="This will remove the exemption and make this requirement needed again."
        warningText="This action changes the approval status immediately."
        buttonLabel="Remove Exemption"
        disabled={!approvalWorkflowActions.canRemoveExemption}
        loading={approvalWorkflowActions.loading}
        onConfirm={approvalWorkflowActions.removeExemption}
      />
    );
  }

  return (
    <Typography color="text.secondary" variant="body2">
      Workflow actions will appear here.
    </Typography>
  );
}
