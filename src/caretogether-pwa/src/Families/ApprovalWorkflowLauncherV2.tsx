import { Autocomplete, Box, Button, TextField } from '@mui/material';
import { useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { policyData } from '../Model/ConfigurationModel';
import type { RequirementContext } from '../Requirements/RequirementContext';
import type { ApprovalLedgerSubject } from './approvalLedgerViewModel';
import { createSyntheticApprovalOccurrence } from './approvalOccurrenceFactory';
import {
  RequirementManagementDrawerV2,
  type RequirementManagementMode,
} from './RequirementManagementDrawerV2';

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
  const [managementMode, setManagementMode] =
    useState<RequirementManagementMode | null>(null);
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
        onChange={(_, value) => {
          setSelectedRequirement(value);
          setManagementMode(null);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search any action"
            fullWidth
            size="small"
          />
        )}
      />
      {occurrence && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button
            variant="contained"
            onClick={() => setManagementMode('complete')}
          >
            Complete
          </Button>
          <Button
            variant="contained"
            onClick={() => setManagementMode('grantExemption')}
          >
            Exempt
          </Button>
        </Box>
      )}
      <RequirementManagementDrawerV2
        mode={managementMode}
        occurrence={occurrence}
        open={Boolean(managementMode && occurrence)}
        onClose={() => setManagementMode(null)}
        onSuccess={() => {
          setManagementMode(null);
          onSuccess?.();
        }}
      />
    </Box>
  );
}
