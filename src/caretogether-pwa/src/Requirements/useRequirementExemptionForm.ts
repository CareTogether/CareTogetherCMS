import { useEffect, useState } from 'react';

type RequirementExemptionFormInput = {
  canExempt?: boolean;
  hasValidArrangementSelection?: boolean;
  resetExemptionKey?: unknown;
  resetOnWorkflowChange?: boolean;
  validateExpiryDate?: boolean;
  workflowOpen?: boolean;
};

export function useRequirementExemptionForm({
  canExempt = true,
  hasValidArrangementSelection = true,
  resetExemptionKey,
  resetOnWorkflowChange = false,
  validateExpiryDate = true,
  workflowOpen = true,
}: RequirementExemptionFormInput) {
  const [additionalComments, setAdditionalComments] = useState('');
  const [exemptionExpiresAtLocal, setExemptionExpiresAtLocal] =
    useState<Date | null>(null);
  const [exemptionExpiresAtError, setExemptionExpiresAtError] = useState(false);
  const [exemptAll, setExemptAll] = useState(false);

  useEffect(() => {
    if (!resetOnWorkflowChange || !workflowOpen) return;

    setAdditionalComments('');
    setExemptionExpiresAtLocal(null);
    setExemptionExpiresAtError(false);
    setExemptAll(false);
  }, [resetExemptionKey, resetOnWorkflowChange, workflowOpen]);

  const hasRequiredExemptionComments = additionalComments !== '';
  const hasValidExemptionExpiry =
    !validateExpiryDate || !exemptionExpiresAtError;
  const hasValidExemption =
    hasRequiredExemptionComments && hasValidExemptionExpiry;
  const canExemptRequirement =
    canExempt && hasValidArrangementSelection && hasValidExemption;

  return {
    additionalComments,
    canExemptRequirement,
    exemptAll,
    exemptionExpiresAtError,
    exemptionExpiresAtLocal,
    hasRequiredExemptionComments,
    hasValidExemption,
    hasValidExemptionExpiry,
    setAdditionalComments,
    setExemptAll,
    setExemptionExpiresAtError,
    setExemptionExpiresAtLocal,
  };
}
