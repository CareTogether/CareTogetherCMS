import { useEffect, useMemo, useState } from 'react';
import {
  Arrangement,
  MissingArrangementRequirement,
  V1Case,
} from '../GeneratedClient';
import { RequirementContext } from './RequirementContext';
import {
  getAvailableArrangementsForRequirement,
  isArrangementRequirementContext,
} from './requirementWorkflowModel';

type ArrangementRequirementSelectionOptions = {
  defaultSelectionScope?: 'arrangement-only' | 'arrangement-workflow-contexts';
  resetOnWorkflowChange?: boolean;
  resetSelectionKey?: unknown;
  workflowOpen?: boolean;
};

type ArrangementRequirementSelectionInput = {
  context: RequirementContext | undefined;
  requirement: MissingArrangementRequirement | unknown;
  selectedV1Case: V1Case | undefined;
} & ArrangementRequirementSelectionOptions;

function defaultSelectedArrangements(
  context: RequirementContext | undefined,
  availableArrangements: Arrangement[],
  defaultSelectionScope: NonNullable<
    ArrangementRequirementSelectionOptions['defaultSelectionScope']
  >
) {
  if (!context) return [];
  if (defaultSelectionScope === 'arrangement-only') {
    if (context.kind !== 'Arrangement') return [];
  } else if (!isArrangementRequirementContext(context)) {
    return [];
  }

  return availableArrangements.filter(
    (arrangement) => arrangement.id === context.arrangementId
  );
}

export function useArrangementRequirementSelection({
  context,
  defaultSelectionScope = 'arrangement-only',
  requirement,
  resetOnWorkflowChange = false,
  resetSelectionKey,
  selectedV1Case,
  workflowOpen = true,
}: ArrangementRequirementSelectionInput) {
  const availableArrangements = useMemo(
    () =>
      getAvailableArrangementsForRequirement(
        selectedV1Case,
        requirement,
        context
      ),
    [context, requirement, selectedV1Case]
  );

  const [applyToArrangements, setApplyToArrangements] = useState(() =>
    defaultSelectedArrangements(
      context,
      availableArrangements,
      defaultSelectionScope
    )
  );

  useEffect(() => {
    if (!resetOnWorkflowChange || !workflowOpen) return;

    setApplyToArrangements(
      defaultSelectedArrangements(
        context,
        availableArrangements,
        defaultSelectionScope
      )
    );
  }, [
    availableArrangements,
    context,
    defaultSelectionScope,
    resetOnWorkflowChange,
    resetSelectionKey,
    workflowOpen,
  ]);

  const selectedArrangementIds = applyToArrangements.map(
    (arrangement) => arrangement.id!
  );
  const requiresArrangementSelection = availableArrangements.length > 0;
  const hasValidArrangementSelection =
    !requiresArrangementSelection || applyToArrangements.length > 0;

  function isArrangementSelected(arrangement: Arrangement) {
    return applyToArrangements.some((item) => item.id === arrangement.id);
  }

  function toggleApplyToArrangement(
    arrangement: Arrangement,
    include: boolean
  ) {
    if (include) {
      setApplyToArrangements((current) => current.concat(arrangement));
      return;
    }

    setApplyToArrangements((current) =>
      current.filter((item) => item.id !== arrangement.id)
    );
  }

  return {
    applyToArrangements,
    availableArrangements,
    hasValidArrangementSelection,
    isArrangementSelected,
    requiresArrangementSelection,
    selectedArrangementIds,
    toggleApplyToArrangement,
  };
}
