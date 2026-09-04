import { useEffect, useState } from 'react';
import {
  findActionableApprovalOccurrence,
  type ApprovalRequirementManagementMode,
} from './approvalDetails';
import type { ApprovalLedgerRow } from './approvalLedgerViewModel';

export function useApprovalDetailsController(
  row: ApprovalLedgerRow | null,
  open: boolean
) {
  const [managementMode, setManagementMode] =
    useState<ApprovalRequirementManagementMode | null>(null);

  useEffect(() => {
    if (!open) setManagementMode(null);
  }, [open]);

  return {
    closeManagement: () => setManagementMode(null),
    managementMode,
    selectManagementMode: setManagementMode,
    workflowOccurrence: findActionableApprovalOccurrence(row),
  };
}
