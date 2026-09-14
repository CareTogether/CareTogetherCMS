import { useState } from 'react';
import type { ArrangementRequirementWorkflowV2 } from './ArrangementRequirementManagementDrawerV2';
import type { ArrangementManagementMode } from './ArrangementManagementDrawerV2';
import type { ArrangementFunctionSummaryV2 } from './arrangementViewModel';

type UseArrangementDetailsWorkflowParameters = {
  defaultFunctionSummary?: ArrangementFunctionSummaryV2 | null;
};

export function useArrangementDetailsWorkflow({
  defaultFunctionSummary = null,
}: UseArrangementDetailsWorkflowParameters = {}) {
  const [managementMode, setManagementMode] =
    useState<ArrangementManagementMode | null>(null);
  const [selectedFunctionSummary, setSelectedFunctionSummary] =
    useState<ArrangementFunctionSummaryV2 | null>(null);
  const [selectedRequirementWorkflow, setSelectedRequirementWorkflow] =
    useState<ArrangementRequirementWorkflowV2 | null>(null);

  function closeManagementDrawer() {
    setManagementMode(null);
  }

  function closeParticipantManagementDrawer() {
    setSelectedFunctionSummary(null);
  }

  function closeRequirementManagementDrawer() {
    setSelectedRequirementWorkflow(null);
  }

  function openDefaultFunctionSummary() {
    setSelectedFunctionSummary(defaultFunctionSummary);
  }

  return {
    closeManagementDrawer,
    closeParticipantManagementDrawer,
    closeRequirementManagementDrawer,
    managementMode,
    openDefaultFunctionSummary,
    selectedFunctionSummary,
    selectedRequirementWorkflow,
    setManagementMode,
    setSelectedRequirementWorkflow,
  };
}
