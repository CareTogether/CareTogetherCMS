import { useState } from 'react';
import {
  CompletedRequirementInfo,
  ExemptedRequirementInfo,
  Permission,
} from '../../GeneratedClient';
import { useFamilyIdPermissions } from '../../Model/SessionModel';
import { useVolunteersModel } from '../../Model/VolunteersModel';
import { useBackdrop } from '../../Hooks/useBackdrop';
import type {
  IndividualVolunteerContext,
  RequirementContext,
  VolunteerFamilyContext,
} from '../../Requirements/RequirementContext';
import type { ApprovalLedgerOccurrence } from '../approvalLedgerViewModel';

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

function isCompletedRequirementInfo(
  requirement: ApprovalLedgerOccurrence['requirement'] | undefined
): requirement is CompletedRequirementInfo {
  return (
    typeof requirement === 'object' &&
    requirement !== null &&
    'completedRequirementId' in requirement &&
    'completedAtUtc' in requirement
  );
}

function isExemptedRequirementInfo(
  requirement: ApprovalLedgerOccurrence['requirement'] | undefined
): requirement is ExemptedRequirementInfo {
  return (
    typeof requirement === 'object' &&
    requirement !== null &&
    'additionalComments' in requirement &&
    'timestampUtc' in requirement
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
    isCompletedRequirementInfo(occurrence.requirement) &&
    permissions(Permission.EditApprovalRequirementCompletion);
  const canRemoveExemption =
    occurrence?.status === 'exempted' &&
    isSupportedApprovalContext(context) &&
    isExemptedRequirementInfo(occurrence.requirement) &&
    permissions(Permission.EditApprovalRequirementExemption);

  async function markIncomplete() {
    if (
      !canMarkIncomplete ||
      !isSupportedApprovalContext(context) ||
      !isCompletedRequirementInfo(occurrence?.requirement)
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
      !isExemptedRequirementInfo(occurrence?.requirement)
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
