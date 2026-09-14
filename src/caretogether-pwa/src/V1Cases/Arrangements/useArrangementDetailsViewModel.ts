import { useMemo } from 'react';
import {
  CompletedRequirementInfo,
  ExemptedRequirementInfo,
  MissingArrangementRequirement,
} from '../../GeneratedClient';
import { RequirementContext } from '../../Requirements/RequirementContext';
import {
  arrangementFunctionSummariesMissingRequiredAssignments,
  arrangementFunctionSummariesMissingVariants,
  arrangementRequirementRequiresAttention,
  defaultArrangementFunctionSummary,
  isUpcomingArrangementRequirement,
} from './arrangementDetailsModel';
import { resolveArrangementWorkspaceModuleV2 } from './ArrangementWorkspaceModuleV2';
import { useRequirementContextData } from './useRequirementContextData';
import {
  ArrangementFunctionSummaryV2,
  ArrangementRowV2,
} from './arrangementViewModel';

type MissingRequirementWithContext = {
  context: RequirementContext;
  missing: MissingArrangementRequirement;
};

type CompletedRequirementWithContext = {
  completed: CompletedRequirementInfo;
  context: RequirementContext;
};

type ExemptedRequirementWithContext = {
  context: RequirementContext;
  exempted: ExemptedRequirementInfo;
};

export type ArrangementAssignmentsViewModel = {
  hasAssignmentIssues: boolean;
  missingRequiredSummaries: ArrangementFunctionSummaryV2[];
  missingVariantSummaries: ArrangementFunctionSummaryV2[];
};

export type ArrangementRequirementsViewModel = {
  completedCount: number;
  completedNeedsAttention: CompletedRequirementWithContext[];
  completedStable: CompletedRequirementWithContext[];
  exemptedNeedsAttention: ExemptedRequirementWithContext[];
  exemptedStable: ExemptedRequirementWithContext[];
  hasRequirements: boolean;
  missingNeedsAttention: MissingRequirementWithContext[];
  missingUpcoming: MissingRequirementWithContext[];
  needsAttentionCount: number;
};

export function useArrangementAssignmentsViewModel(
  row: ArrangementRowV2
): ArrangementAssignmentsViewModel {
  return useMemo(() => {
    const missingRequiredSummaries =
      arrangementFunctionSummariesMissingRequiredAssignments(
        row.functionSummaries
      );
    const missingVariantSummaries = arrangementFunctionSummariesMissingVariants(
      row.functionSummaries
    );

    return {
      hasAssignmentIssues:
        missingRequiredSummaries.length > 0 ||
        missingVariantSummaries.length > 0,
      missingRequiredSummaries,
      missingVariantSummaries,
    };
  }, [row.functionSummaries]);
}

export function useArrangementRequirementsViewModel(
  row: ArrangementRowV2
): ArrangementRequirementsViewModel {
  const {
    completedRequirementsWithContext,
    exemptedRequirementsWithContext,
    mergedArray,
  } = useRequirementContextData(
    row.source,
    row.arrangementPolicy,
    row.partneringFamily,
    row.v1Case.id!
  );

  return useMemo(() => {
    const hasRequirements =
      mergedArray.length > 0 ||
      completedRequirementsWithContext.length > 0 ||
      exemptedRequirementsWithContext.length > 0;
    const missingNeedsAttention = mergedArray.filter(
      ({ missing }) => !isUpcomingArrangementRequirement(missing)
    );
    const missingUpcoming = mergedArray.filter(({ missing }) =>
      isUpcomingArrangementRequirement(missing)
    );
    const completedNeedsAttention = completedRequirementsWithContext.filter(
      ({ completed }) => arrangementRequirementRequiresAttention(completed)
    );
    const completedStable = completedRequirementsWithContext.filter(
      ({ completed }) => !arrangementRequirementRequiresAttention(completed)
    );
    const exemptedNeedsAttention = exemptedRequirementsWithContext.filter(
      ({ exempted }) => arrangementRequirementRequiresAttention(exempted)
    );
    const exemptedStable = exemptedRequirementsWithContext.filter(
      ({ exempted }) => !arrangementRequirementRequiresAttention(exempted)
    );

    return {
      completedCount: completedStable.length + exemptedStable.length,
      completedNeedsAttention,
      completedStable,
      exemptedNeedsAttention,
      exemptedStable,
      hasRequirements,
      missingNeedsAttention,
      missingUpcoming,
      needsAttentionCount:
        missingNeedsAttention.length +
        completedNeedsAttention.length +
        exemptedNeedsAttention.length,
    };
  }, [
    completedRequirementsWithContext,
    exemptedRequirementsWithContext,
    mergedArray,
  ]);
}

export function useArrangementWorkspaceViewModel(row: ArrangementRowV2) {
  return useMemo(() => {
    const workspaceModule = resolveArrangementWorkspaceModuleV2(row);

    return {
      defaultFunctionSummary: defaultArrangementFunctionSummary(
        row.functionSummaries
      ),
      workspaceModule,
      WorkspaceModuleComponent: workspaceModule?.Component,
    };
  }, [row]);
}
