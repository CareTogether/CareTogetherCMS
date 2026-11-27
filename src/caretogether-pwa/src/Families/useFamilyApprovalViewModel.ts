import { useMemo } from 'react';
import { CombinedFamilyInfo } from '../GeneratedClient';
import { approvalAttentionCounts as countApprovalAttention } from '../Approvals/approvalLedgerStatusPresentation';
import { buildApprovalLedgerRows } from '../Approvals/approvalLedgerViewModel';
import { familyApprovalLedgerInput } from '../Approvals/familyApprovalLedgerInput';
import {
  buildRemovedRoleSummaries,
  buildRoleSummaryCards,
} from './roleSummaryViewModel';

type UseFamilyApprovalViewModelParameters = {
  family?: CombinedFamilyInfo;
  familyId: string;
  selectedRemovedRoleId: string | null;
  selectedRoleSummaryCardId: string | null;
};

export function useFamilyApprovalViewModel({
  family,
  familyId,
  selectedRemovedRoleId,
  selectedRoleSummaryCardId,
}: UseFamilyApprovalViewModelParameters) {
  const ledgerInput = useMemo(
    () => familyApprovalLedgerInput(family, familyId),
    [family, familyId]
  );
  const approvalLedgerRows = useMemo(
    () => buildApprovalLedgerRows(ledgerInput),
    [ledgerInput]
  );

  const roleSummaryCards = useMemo(
    () => buildRoleSummaryCards({ ...ledgerInput, approvalLedgerRows }),
    [ledgerInput, approvalLedgerRows]
  );

  const selectedRoleSummaryCard = useMemo(
    () =>
      roleSummaryCards.find((card) => card.id === selectedRoleSummaryCardId) ??
      null,
    [roleSummaryCards, selectedRoleSummaryCardId]
  );

  const removedRoleSummaries = useMemo(
    () => buildRemovedRoleSummaries(ledgerInput),
    [ledgerInput]
  );

  const selectedRemovedRole = useMemo(
    () =>
      removedRoleSummaries.find(
        (removedRole) => removedRole.id === selectedRemovedRoleId
      ) ?? null,
    [removedRoleSummaries, selectedRemovedRoleId]
  );

  const approvalAttentionCounts = useMemo(
    () => countApprovalAttention(approvalLedgerRows),
    [approvalLedgerRows]
  );

  return {
    approvalAttentionCounts,
    approvalLedgerRows,
    removedRoleSummaries,
    roleSummaryCards,
    selectedRemovedRole,
    selectedRoleSummaryCard,
  };
}
