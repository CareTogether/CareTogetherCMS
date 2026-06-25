import { Autocomplete, Box, TextField } from '@mui/material';
import { useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { policyData } from '../Model/ConfigurationModel';
import type { RequirementContext } from '../Requirements/RequirementContext';
import type { ApprovalLedgerSubject } from './approvalLedgerViewModel';
import { ApprovalRequirementWorkflowV2 } from './ApprovalRequirementWorkflowV2';
import { createSyntheticApprovalOccurrence } from './approvalOccurrenceFactory';

type ApprovalWorkflowLauncherV2Props = {
  subject: ApprovalLedgerSubject;
  context: RequirementContext;
  onSuccess?: () => void;
};

export function ApprovalWorkflowLauncherV2({
  subject,
  context,
  onSuccess,
}: ApprovalWorkflowLauncherV2Props) {
  const policy = useRecoilValue(policyData);
  const [selectedRequirement, setSelectedRequirement] = useState<string | null>(
    null
  );
  const actionNames = useMemo(() => {
    const names = Object.entries(policy.actionDefinitions).flatMap(
      ([actionName, actionDefinition]) => [
        actionName,
        ...(actionDefinition.alternateNames ?? []),
      ]
    );

    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  }, [policy.actionDefinitions]);
  const occurrence = selectedRequirement
    ? createSyntheticApprovalOccurrence({
        requirementName: selectedRequirement,
        subject,
        context,
      })
    : undefined;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Autocomplete
        options={actionNames}
        getOptionLabel={(option) => option}
        value={selectedRequirement}
        onChange={(_, value) => setSelectedRequirement(value)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search any action"
            fullWidth
            size="small"
          />
        )}
      />
      <ApprovalRequirementWorkflowV2
        occurrence={occurrence}
        onSuccess={onSuccess}
      />
    </Box>
  );
}
