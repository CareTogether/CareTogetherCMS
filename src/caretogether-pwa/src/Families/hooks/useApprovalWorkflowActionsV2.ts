import { useState } from 'react';
import { Permission } from '../../GeneratedClient';
import { useFamilyIdPermissions } from '../../Model/SessionModel';
import { useVolunteersModel } from '../../Model/VolunteersModel';
import { useBackdrop } from '../../Hooks/useBackdrop';
import type {
  IndividualVolunteerContext,
  RequirementContext,
  VolunteerFamilyContext,
} from '../../Requirements/RequirementContext';
import type { ApprovalLedgerOccurrence } from '../../Approvals/approvalLedgerViewModel';
import {
  isCompletedApprovalOccurrence,
  isExemptedApprovalOccurrence,
} from '../../Approvals/approvalDetails';

type SupportedApprovalContext =
  | VolunteerFamilyContext
  | IndividualVolunteerContext;

function isSupportedApprovalContext(
  context: RequirementContext | undefined
): context is SupportedApprovalContext {
  return (
    context?.kind === 'Volunteer Family' ||
    context?.kind === 'Individual Volunteer'
  );
}

export function useApprovalWorkflowActionsV2(
  occurrence: ApprovalLedgerOccurrence | undefined,
  onSuccess?: () => void
) {
  const volunteers = useVolunteersModel();
  const withBackdrop = useBackdrop();
  const [loading, setLoading] = useState(false);
  const context = occurrence?.context;
  const familyId = isSupportedApprovalContext(context)
    ? context.volunteerFamilyId
    : '';
  const permissions = useFamilyIdPermissions(familyId);
  const canMarkIncomplete =
    occurrence?.status === 'completed' &&
    isSupportedApprovalContext(context) &&
    isCompletedApprovalOccurrence(occurrence) &&
    permissions(Permission.EditApprovalRequirementCompletion);
  const canRemoveExemption =
    occurrence?.status === 'exempted' &&
    isSupportedApprovalContext(context) &&
    isExemptedApprovalOccurrence(occurrence) &&
    permissions(Permission.EditApprovalRequirementExemption);

  async function markIncomplete() {
    if (
      !canMarkIncomplete ||
      !isSupportedApprovalContext(context) ||
      !isCompletedApprovalOccurrence(occurrence)
    ) {
      return;
    }

    const completedRequirement = occurrence.requirement;

    setLoading(true);
    try {
      await withBackdrop(async () => {
        if (context.kind === 'Volunteer Family') {
          await volunteers.markFamilyRequirementIncomplete(
            context.volunteerFamilyId,
            completedRequirement
          );
        } else {
          await volunteers.markIndividualRequirementIncomplete(
            context.volunteerFamilyId,
            context.personId,
            completedRequirement
          );
        }

        onSuccess?.();
      });
    } finally {
      setLoading(false);
    }
  }

  async function removeExemption() {
    if (
      !canRemoveExemption ||
      !isSupportedApprovalContext(context) ||
      !isExemptedApprovalOccurrence(occurrence)
    ) {
      return;
    }

    const exemptedRequirement = occurrence.requirement;

    setLoading(true);
    try {
      await withBackdrop(async () => {
        if (context.kind === 'Volunteer Family') {
          await volunteers.unexemptVolunteerFamilyRequirement(
            context.volunteerFamilyId,
            exemptedRequirement
          );
        } else {
          await volunteers.unexemptVolunteerRequirement(
            context.volunteerFamilyId,
            context.personId,
            exemptedRequirement
          );
        }

        onSuccess?.();
      });
    } finally {
      setLoading(false);
    }
  }

  return {
    canMarkIncomplete,
    canRemoveExemption,
    loading,
    markIncomplete,
    removeExemption,
  };
}
