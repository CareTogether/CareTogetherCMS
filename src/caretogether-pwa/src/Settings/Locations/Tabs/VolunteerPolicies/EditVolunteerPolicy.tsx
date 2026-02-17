import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useEffect, useMemo, useState } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { selectedLocationContextState } from '../../../../Model/Data';
import { api } from '../../../../Api/Api';
import {
  EffectiveLocationPolicy,
  RequirementStage,
  VolunteerApprovalRequirement,
  VolunteerFamilyApprovalRequirement,
  VolunteerFamilyRequirementScope,
  VolunteerFamilyRolePolicy,
  VolunteerFamilyRolePolicyVersion,
  VolunteerRolePolicy,
  VolunteerRolePolicyVersion,
  VolunteerPolicy,
} from '../../../../GeneratedClient';
import { effectiveLocationPolicyEdited } from '../../../../Model/ConfigurationModel';
import { useBackdrop } from '../../../../Hooks/useBackdrop';

export type VolunteerPolicyType = 'individual' | 'family';
export type ActionNameOption = {
  name: string;
  alternateNames: string[];
};
type SelectableActionNameOption = {
  value: string;
  mainName: string;
  isAlternate: boolean;
};

type RequirementFormData = {
  id: string;
  stage: RequirementStage | null;
  actionName: string;
  scope?: VolunteerFamilyRequirementScope;
};

type PolicyVersionFormData = {
  id: string;
  version: string;
  supersededAtUtc: string;
  requirements: RequirementFormData[];
};

export type VolunteerPolicyEditorData = {
  originalPolicyName?: string;
  policyName: string;
  policyVersions: PolicyVersionFormData[];
};

type Props = {
  type: VolunteerPolicyType;
  actionNameOptions: ActionNameOption[];
  data?: VolunteerPolicyEditorData;
  onClose: () => void;
};

function getRequirementStageLabel(stage: RequirementStage): string {
  switch (stage) {
    case RequirementStage.Application:
      return 'Application';
    case RequirementStage.Approval:
      return 'Approval';
    case RequirementStage.Onboarding:
      return 'Onboarding';
    default: {
      const exhaustiveCheck: never = stage;
      return exhaustiveCheck;
    }
  }
}

const requirementStageOptions = Object.values(RequirementStage)
  .filter((value): value is RequirementStage => typeof value === 'number')
  .map((value) => ({
    label: getRequirementStageLabel(value),
    value,
  }));

function getFamilyScopeLabel(scope: VolunteerFamilyRequirementScope): string {
  switch (scope) {
    case VolunteerFamilyRequirementScope.OncePerFamily:
      return 'Once Per Family';
    case VolunteerFamilyRequirementScope.AllAdultsInTheFamily:
      return 'All Adults In The Family';
    case VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily:
      return 'All Participating Adults In The Family';
    default: {
      const exhaustiveCheck: never = scope;
      return exhaustiveCheck;
    }
  }
}

const familyScopeOptions = Object.values(VolunteerFamilyRequirementScope)
  .filter(
    (value): value is VolunteerFamilyRequirementScope =>
      typeof value === 'number'
  )
  .map((value) => ({
    label: getFamilyScopeLabel(value),
    value,
  }));

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function emptyRequirementForAction(
  type: VolunteerPolicyType,
  actionName: string
): RequirementFormData {
  return {
    id: createId(),
    stage: null,
    actionName,
    scope:
      type === 'family'
        ? VolunteerFamilyRequirementScope.OncePerFamily
        : undefined,
  };
}

function normalizeRequirements(
  type: VolunteerPolicyType,
  actionOptions: SelectableActionNameOption[],
  requirements: RequirementFormData[]
): RequirementFormData[] {
  const byActionName = new Map(
    requirements.map((requirement) => [requirement.actionName, requirement])
  );

  return actionOptions.map((option) => {
    const existingRequirement = byActionName.get(option.value);
    if (!existingRequirement) {
      return emptyRequirementForAction(type, option.value);
    }

    return {
      id: existingRequirement.id || createId(),
      actionName: option.value,
      stage: existingRequirement.stage ?? null,
      scope:
        type === 'family'
          ? (existingRequirement.scope ??
            VolunteerFamilyRequirementScope.OncePerFamily)
          : undefined,
    };
  });
}

function emptyVersion(
  type: VolunteerPolicyType,
  actionOptions: SelectableActionNameOption[]
): PolicyVersionFormData {
  return {
    id: createId(),
    version: '',
    supersededAtUtc: '',
    requirements: normalizeRequirements(type, actionOptions, []),
  };
}

function getInitialVersions(
  type: VolunteerPolicyType,
  actionOptions: SelectableActionNameOption[],
  data?: VolunteerPolicyEditorData
): PolicyVersionFormData[] {
  if (data?.policyVersions?.length) {
    return data.policyVersions.map((version) => ({
      ...version,
      requirements: normalizeRequirements(
        type,
        actionOptions,
        version.requirements ?? []
      ),
    }));
  }

  return [emptyVersion(type, actionOptions)];
}

export default function EditVolunteerPolicy({
  type,
  actionNameOptions,
  data,
  onClose,
}: Props) {
  const { organizationId, locationId } = useRecoilValue(
    selectedLocationContextState
  );

  const setEditedPolicy = useSetRecoilState(effectiveLocationPolicyEdited);
  const withBackdrop = useBackdrop();
  const selectableActionNameOptions = useMemo<SelectableActionNameOption[]>(
    () =>
      actionNameOptions.flatMap((option) => [
        {
          value: option.name,
          mainName: option.name,
          isAlternate: false,
        },
        ...option.alternateNames.map((alternateName) => ({
          value: alternateName,
          mainName: option.name,
          isAlternate: true,
        })),
      ]),
    [actionNameOptions]
  );
  const actionOptionMap = useMemo(
    () =>
      new Map(
        selectableActionNameOptions.map((option) => [option.value, option])
      ),
    [selectableActionNameOptions]
  );

  const [policyName, setPolicyName] = useState(data?.policyName ?? '');
  const [policyVersions, setPolicyVersions] = useState<PolicyVersionFormData[]>(
    () => getInitialVersions(type, selectableActionNameOptions, data)
  );

  useEffect(() => {
    setPolicyVersions((previous) =>
      previous.map((version) => ({
        ...version,
        requirements: normalizeRequirements(
          type,
          selectableActionNameOptions,
          version.requirements
        ),
      }))
    );
  }, [type, selectableActionNameOptions]);

  const isValid = useMemo(() => {
    if (!policyName.trim()) return false;
    if (policyVersions.length === 0) return false;

    return policyVersions.every((version) => Boolean(version.version.trim()));
  }, [policyName, policyVersions]);

  const updateVersion = (
    versionId: string,
    update: (version: PolicyVersionFormData) => PolicyVersionFormData
  ) => {
    setPolicyVersions((previous) =>
      previous.map((version) =>
        version.id === versionId ? update(version) : version
      )
    );
  };

  const addVersion = () => {
    setPolicyVersions((previous) => [
      ...previous,
      emptyVersion(type, selectableActionNameOptions),
    ]);
  };

  const removeVersion = (versionId: string) => {
    setPolicyVersions((previous) =>
      previous.filter((version) => version.id !== versionId)
    );
  };

  const save = async () => {
    await withBackdrop(async () => {
      const trimmedPolicyName = policyName.trim();

      const currentPolicy = await api.configuration.getEffectiveLocationPolicy(
        organizationId,
        locationId
      );

      const existingVolunteerPolicy =
        currentPolicy.volunteerPolicy ?? new VolunteerPolicy();
      const volunteerRoles = {
        ...(existingVolunteerPolicy.volunteerRoles ?? {}),
      };
      const volunteerFamilyRoles = {
        ...(existingVolunteerPolicy.volunteerFamilyRoles ?? {}),
      };

      if (type === 'individual') {
        const versions = policyVersions.map(
          (version) =>
            new VolunteerRolePolicyVersion({
              version: version.version.trim(),
              supersededAtUtc: version.supersededAtUtc
                ? new Date(version.supersededAtUtc)
                : undefined,
              requirements: version.requirements
                .filter((requirement) => requirement.stage !== null)
                .map(
                  (requirement) =>
                    new VolunteerApprovalRequirement({
                      stage: requirement.stage!,
                      actionName: requirement.actionName.trim(),
                    })
                ),
            })
        );

        const originalPolicyName = data?.originalPolicyName ?? data?.policyName;
        if (originalPolicyName && originalPolicyName !== trimmedPolicyName) {
          delete volunteerRoles[originalPolicyName];
        }

        volunteerRoles[trimmedPolicyName] = new VolunteerRolePolicy({
          volunteerRoleType: trimmedPolicyName,
          policyVersions: versions,
        });
      } else {
        const versions = policyVersions.map(
          (version) =>
            new VolunteerFamilyRolePolicyVersion({
              version: version.version.trim(),
              supersededAtUtc: version.supersededAtUtc
                ? new Date(version.supersededAtUtc)
                : undefined,
              requirements: version.requirements
                .filter((requirement) => requirement.stage !== null)
                .map(
                  (requirement) =>
                    new VolunteerFamilyApprovalRequirement({
                      stage: requirement.stage!,
                      actionName: requirement.actionName.trim(),
                      scope:
                        requirement.scope ??
                        VolunteerFamilyRequirementScope.OncePerFamily,
                    })
                ),
            })
        );

        const originalPolicyName = data?.originalPolicyName ?? data?.policyName;
        if (originalPolicyName && originalPolicyName !== trimmedPolicyName) {
          delete volunteerFamilyRoles[originalPolicyName];
        }

        volunteerFamilyRoles[trimmedPolicyName] = new VolunteerFamilyRolePolicy(
          {
            volunteerFamilyRoleType: trimmedPolicyName,
            policyVersions: versions,
          }
        );
      }

      const updatedVolunteerPolicy = new VolunteerPolicy({
        ...existingVolunteerPolicy,
        volunteerRoles,
        volunteerFamilyRoles,
      });

      const updatedPolicy = new EffectiveLocationPolicy({
        ...currentPolicy,
        volunteerPolicy: updatedVolunteerPolicy,
      });

      const savedPolicy = await api.configuration.putEffectiveLocationPolicy(
        organizationId,
        locationId,
        updatedPolicy
      );

      setEditedPolicy(savedPolicy);
      onClose();
    });
  };

  return (
    <Box sx={{ width: { xs: 360, sm: 560, md: 700 }, maxWidth: '100vw' }}>
      <Stack spacing={2}>
        <Typography variant="h6">
          {data
            ? `Edit ${type === 'individual' ? 'Volunteer Role' : 'Volunteer Family Role'} Policy`
            : `Add ${type === 'individual' ? 'Volunteer Role' : 'Volunteer Family Role'} Policy`}
        </Typography>

        <TextField
          fullWidth
          label="Policy name"
          value={policyName}
          onChange={(e) => setPolicyName(e.target.value)}
          required
          autoFocus
        />

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="subtitle1">Policy Versions</Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addVersion}
          >
            Add new version
          </Button>
        </Stack>

        {policyVersions.map((version, versionIndex) => (
          <Box
            key={version.id}
            sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}
          >
            <Stack spacing={2}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="subtitle2">
                  Version {versionIndex + 1}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => removeVersion(version.id)}
                  disabled={policyVersions.length === 1}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  label="Version"
                  value={version.version}
                  onChange={(e) =>
                    updateVersion(version.id, (existing) => ({
                      ...existing,
                      version: e.target.value,
                    }))
                  }
                  required
                />
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Superseded at"
                  value={version.supersededAtUtc}
                  InputLabelProps={{ shrink: true }}
                  onChange={(e) =>
                    updateVersion(version.id, (existing) => ({
                      ...existing,
                      supersededAtUtc: e.target.value,
                    }))
                  }
                />
              </Stack>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{ width: type === 'family' ? '58%' : '70%' }}
                      >
                        Action name
                      </TableCell>
                      <TableCell
                        sx={{ width: type === 'family' ? '20%' : '30%' }}
                      >
                        Stage
                      </TableCell>
                      {type === 'family' && (
                        <TableCell sx={{ width: '22%' }}>Scope</TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {version.requirements.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={type === 'family' ? 3 : 2}>
                          <Typography variant="body2" color="text.secondary">
                            No action definitions found.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {version.requirements.map((requirement) => (
                      <TableRow key={requirement.id}>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              color: actionOptionMap.get(requirement.actionName)
                                ?.isAlternate
                                ? 'text.secondary'
                                : 'text.primary',
                              fontStyle: actionOptionMap.get(
                                requirement.actionName
                              )?.isAlternate
                                ? 'italic'
                                : 'normal',
                              pl: actionOptionMap.get(requirement.actionName)
                                ?.isAlternate
                                ? 1.5
                                : 0,
                            }}
                          >
                            {requirement.actionName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            select
                            value={requirement.stage ?? ''}
                            SelectProps={{
                              displayEmpty: true,
                              renderValue: (selected) => {
                                if (selected === '') return 'N/A';
                                return (
                                  requirementStageOptions.find(
                                    (option) => option.value === Number(selected)
                                  )?.label ?? 'N/A'
                                );
                              },
                            }}
                            onChange={(e) =>
                              updateVersion(version.id, (existing) => ({
                                ...existing,
                                requirements: existing.requirements.map((x) =>
                                  x.id === requirement.id
                                    ? {
                                        ...x,
                                        stage:
                                          e.target.value === ''
                                            ? null
                                            : (Number(
                                                e.target.value
                                              ) as RequirementStage),
                                      }
                                    : x
                                ),
                              }))
                            }
                          >
                            <MenuItem value="">
                              <em>N/A</em>
                            </MenuItem>
                            {requirementStageOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        </TableCell>
                        {type === 'family' && (
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              select
                              disabled={requirement.stage === null}
                              value={
                                requirement.stage === null
                                  ? ''
                                  : (requirement.scope ?? '')
                              }
                              SelectProps={{
                                displayEmpty: true,
                                renderValue: (selected) => {
                                  if (selected === '') return 'N/A';
                                  return (
                                    familyScopeOptions.find(
                                      (option) =>
                                        option.value === Number(selected)
                                    )?.label ?? 'N/A'
                                  );
                                },
                              }}
                              onChange={(e) =>
                                updateVersion(version.id, (existing) => ({
                                  ...existing,
                                  requirements: existing.requirements.map(
                                    (x) =>
                                      x.id === requirement.id
                                        ? {
                                            ...x,
                                            scope:
                                              e.target.value === ''
                                                ? undefined
                                                : (Number(
                                                    e.target.value
                                                  ) as VolunteerFamilyRequirementScope),
                                          }
                                        : x
                                  ),
                                }))
                              }
                            >
                              <MenuItem value="">
                                <em>N/A</em>
                              </MenuItem>
                              {familyScopeOptions.map((option) => (
                                <MenuItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="caption" color="text.secondary">
                Actions with empty stage are ignored when saving this policy
                version.
              </Typography>
            </Stack>
          </Box>
        ))}

        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button variant="contained" color="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={!isValid}
            onClick={save}
          >
            Save
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
