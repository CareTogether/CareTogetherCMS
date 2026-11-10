import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  TextField,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useFamilyLookup } from '../Model/DirectoryModel';
import { usePolicy } from '../Model/PolicyModel';
import type { RequirementContext } from '../Requirements/RequirementContext';
import type { ApprovalLedgerSubject } from '../Approvals/approvalLedgerViewModel';
import { createSyntheticApprovalOccurrence } from './approvalOccurrenceFactory';
import {
  FAMILY_TARGET_KEY,
  completeOtherTargetOptions,
  completeOtherTargetsFromKeys,
  initialCompleteOtherTargetKeys,
  toggleCompleteOtherTargetKey,
} from './completeOtherTargets';
import {
  RequirementManagementDrawerV2,
  type RequirementManagementMode,
} from './RequirementManagementDrawerV2';

type ApprovalWorkflowLauncherV2Props = {
  subject: ApprovalLedgerSubject;
  context: RequirementContext;
  onSuccess?: () => void;
};

function volunteerFamilyId(context: RequirementContext) {
  if (
    context.kind === 'Volunteer Family' ||
    context.kind === 'Individual Volunteer'
  ) {
    return context.volunteerFamilyId;
  }

  return undefined;
}

export function ApprovalWorkflowLauncherV2({
  subject,
  context,
  onSuccess,
}: ApprovalWorkflowLauncherV2Props) {
  const policy = usePolicy();
  const familyLookup = useFamilyLookup();
  const familyId = volunteerFamilyId(context);
  const family = familyId ? familyLookup(familyId) : undefined;
  const [selectedRequirement, setSelectedRequirement] = useState<string | null>(
    null
  );
  const [managementMode, setManagementMode] =
    useState<RequirementManagementMode | null>(null);
  const [selectedTargetKeys, setSelectedTargetKeys] = useState(() =>
    initialCompleteOtherTargetKeys(context)
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
  const targetOptions = useMemo(
    () =>
      familyId
        ? completeOtherTargetOptions(
            family?.family?.adults?.flatMap((adult) =>
              adult.item1 ? [adult.item1] : []
            ) ?? []
          )
        : [],
    [familyId, family?.family?.adults]
  );
  const selectedTargetOptions = targetOptions.filter((option) =>
    selectedTargetKeys.includes(option.key)
  );
  const targets =
    targetOptions.length > 0
      ? completeOtherTargetsFromKeys(
          selectedTargetOptions.map((option) => option.key)
        )
      : undefined;
  const occurrenceSubject: ApprovalLedgerSubject =
    selectedTargetOptions.length > 0
      ? {
          scope: selectedTargetKeys.includes(FAMILY_TARGET_KEY)
            ? 'family'
            : 'person',
          id: selectedTargetOptions.map((option) => option.key).join(','),
          label: selectedTargetOptions.map((option) => option.label).join(', '),
        }
      : subject;
  const hasTargets = !targets || selectedTargetOptions.length > 0;
  const occurrence = selectedRequirement
    ? createSyntheticApprovalOccurrence({
        requirementName: selectedRequirement,
        subject: occurrenceSubject,
        context,
      })
    : undefined;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {targetOptions.length > 0 && (
        <FormControl component="fieldset" variant="standard">
          <FormLabel component="legend">Record for</FormLabel>
          <FormGroup>
            {targetOptions.map((option) => (
              <FormControlLabel
                key={option.key}
                control={
                  <Checkbox
                    checked={selectedTargetKeys.includes(option.key)}
                    onChange={(_, checked) =>
                      setSelectedTargetKeys((current) =>
                        toggleCompleteOtherTargetKey(
                          current,
                          option.key,
                          checked
                        )
                      )
                    }
                  />
                }
                label={option.label}
              />
            ))}
          </FormGroup>
        </FormControl>
      )}
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
            disabled={!hasTargets}
            variant="contained"
            onClick={() => setManagementMode('complete')}
          >
            Complete
          </Button>
          <Button
            disabled={!hasTargets}
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
        targets={targets}
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
