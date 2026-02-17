import {
  Box,
  Button,
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
import { useEffect, useMemo, useState } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import {
  EffectiveLocationPolicy,
  RequirementStage,
  VolunteerApprovalRequirement,
  VolunteerFamilyApprovalRequirement,
  VolunteerFamilyRequirementScope,
  VolunteerFamilyRolePolicy,
  VolunteerFamilyRolePolicyVersion,
  VolunteerPolicy,
  VolunteerRolePolicy,
  VolunteerRolePolicyVersion,
} from '../../../../GeneratedClient';
import {
  effectiveLocationPolicyEdited,
  policyData,
} from '../../../../Model/ConfigurationModel';
import { selectedLocationContextState } from '../../../../Model/Data';
import { api } from '../../../../Api/Api';
import { useBackdrop } from '../../../../Hooks/useBackdrop';
import { useUserIsOrganizationAdministrator } from '../../../../Model/SessionModel';

function getRequirementStageLabel(value: RequirementStage): string {
  switch (value) {
    case RequirementStage.Application:
      return 'Application';
    case RequirementStage.Approval:
      return 'Approval';
    case RequirementStage.Onboarding:
      return 'Onboarding';
    default: {
      const exhaustiveCheck: never = value;
      return exhaustiveCheck;
    }
  }
}

const stageOptions = Object.values(RequirementStage)
  .filter((value): value is RequirementStage => typeof value === 'number')
  .map((value) => ({
    value,
    label: getRequirementStageLabel(value),
  }));

function getFamilyScopeLabel(value: VolunteerFamilyRequirementScope): string {
  switch (value) {
    case VolunteerFamilyRequirementScope.OncePerFamily:
      return 'Once Per Family';
    case VolunteerFamilyRequirementScope.AllAdultsInTheFamily:
      return 'All Adults In The Family';
    case VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily:
      return 'All Participating Adults In The Family';
    default: {
      const exhaustiveCheck: never = value;
      return exhaustiveCheck;
    }
  }
}

const scopeOptions = Object.values(VolunteerFamilyRequirementScope)
  .filter(
    (value): value is VolunteerFamilyRequirementScope => typeof value === 'number'
  )
  .map((value) => ({
    value,
    label: getFamilyScopeLabel(value),
  }));

type MatrixRow = {
  id: string;
  actionName: string;
  actionLabel: string;
  stage: RequirementStage;
  familyScopes: Record<string, VolunteerFamilyRequirementScope | ''>;
  individualRequired: Record<string, boolean>;
};

type ActionOption = {
  value: string;
  label: string;
};

type RoleMeta = {
  roleName: string;
  versionIndex: number;
  versionLabel: string;
  hasVersion: boolean;
};

function getDefaultVersionIndex(versions: { supersededAtUtc?: Date }[] = []) {
  if (versions.length === 0) return -1;
  const activeIndex = versions.findIndex((version) => !version.supersededAtUtc);
  return activeIndex >= 0 ? activeIndex : 0;
}

function getFamilyVersionRequirements(
  roleMeta: RoleMeta,
  volunteerFamilyRoles: Record<string, VolunteerFamilyRolePolicy>
) {
  if (!roleMeta.hasVersion) return [] as VolunteerFamilyApprovalRequirement[];

  const policy = volunteerFamilyRoles[roleMeta.roleName];
  const version = policy?.policyVersions?.[roleMeta.versionIndex];
  return version?.requirements ?? [];
}

function getIndividualVersionRequirements(
  roleMeta: RoleMeta,
  volunteerRoles: Record<string, VolunteerRolePolicy>
) {
  if (!roleMeta.hasVersion) return [] as VolunteerApprovalRequirement[];

  const policy = volunteerRoles[roleMeta.roleName];
  const version = policy?.policyVersions?.[roleMeta.versionIndex];
  return version?.requirements ?? [];
}

function buildRows(
  actionOptions: ActionOption[],
  familyRoleMeta: RoleMeta[],
  individualRoleMeta: RoleMeta[],
  volunteerFamilyRoles: Record<string, VolunteerFamilyRolePolicy>,
  volunteerRoles: Record<string, VolunteerRolePolicy>
): MatrixRow[] {
  return actionOptions.map((action) => {
    const stages = [
      ...familyRoleMeta.flatMap((roleMeta) =>
        getFamilyVersionRequirements(roleMeta, volunteerFamilyRoles)
          .filter((requirement) => requirement.actionName === action.value)
          .map((requirement) => requirement.stage)
      ),
      ...individualRoleMeta.flatMap((roleMeta) =>
        getIndividualVersionRequirements(roleMeta, volunteerRoles)
          .filter((requirement) => requirement.actionName === action.value)
          .map((requirement) => requirement.stage)
      ),
    ];

    const stage =
      stages.length > 0
        ? [...stages].sort((a, b) => a - b)[0]
        : RequirementStage.Application;

    const familyScopes = Object.fromEntries(
      familyRoleMeta.map((roleMeta) => {
        const requirement = getFamilyVersionRequirements(
          roleMeta,
          volunteerFamilyRoles
        ).find(
          (req) => req.actionName === action.value && req.stage === stage
        );

        return [roleMeta.roleName, requirement?.scope ?? ''];
      })
    ) as Record<string, VolunteerFamilyRequirementScope | ''>;

    const individualRequired = Object.fromEntries(
      individualRoleMeta.map((roleMeta) => {
        const hasRequirement = getIndividualVersionRequirements(
          roleMeta,
          volunteerRoles
        ).some(
          (req) => req.actionName === action.value && req.stage === stage
        );

        return [roleMeta.roleName, hasRequirement];
      })
    ) as Record<string, boolean>;

    return {
      id: action.value,
      actionName: action.value,
      actionLabel: action.label,
      stage,
      familyScopes,
      individualRequired,
    };
  });
}

export default function VolunteerRolesMatrix() {
  const effectiveLocationPolicy = useRecoilValue(policyData);
  const { organizationId, locationId } = useRecoilValue(
    selectedLocationContextState
  );
  const setEditedPolicy = useSetRecoilState(effectiveLocationPolicyEdited);
  const withBackdrop = useBackdrop();
  const canEdit = useUserIsOrganizationAdministrator();

  const volunteerPolicy = effectiveLocationPolicy?.volunteerPolicy;
  const volunteerFamilyRoles = useMemo(
    () => volunteerPolicy?.volunteerFamilyRoles ?? {},
    [volunteerPolicy?.volunteerFamilyRoles]
  );
  const volunteerRoles = useMemo(
    () => volunteerPolicy?.volunteerRoles ?? {},
    [volunteerPolicy?.volunteerRoles]
  );

  const familyRoleMeta = useMemo<RoleMeta[]>(
    () =>
      Object.entries(volunteerFamilyRoles).map(([roleName, policy]) => {
        const versionIndex = getDefaultVersionIndex(policy.policyVersions ?? []);
        const version = policy.policyVersions?.[versionIndex];
        return {
          roleName,
          versionIndex,
          versionLabel: version?.version ?? 'No version',
          hasVersion: versionIndex >= 0,
        };
      }),
    [volunteerFamilyRoles]
  );

  const individualRoleMeta = useMemo<RoleMeta[]>(
    () =>
      Object.entries(volunteerRoles).map(([roleName, policy]) => {
        const versionIndex = getDefaultVersionIndex(policy.policyVersions ?? []);
        const version = policy.policyVersions?.[versionIndex];
        return {
          roleName,
          versionIndex,
          versionLabel: version?.version ?? 'No version',
          hasVersion: versionIndex >= 0,
        };
      }),
    [volunteerRoles]
  );

  const actionOptions = useMemo<ActionOption[]>(() => {
    const configured = Object.entries(
      effectiveLocationPolicy?.actionDefinitions ?? {}
    ).flatMap(([name, definition]) => [
      { value: name, label: name },
      ...(definition.alternateNames ?? []).map((alternateName) => ({
        value: alternateName,
        label: `${alternateName} (${name})`,
      })),
    ]);

    const fromPolicies = [
      ...Object.values(volunteerFamilyRoles).flatMap((policy) =>
        (policy.policyVersions ?? []).flatMap((version) =>
          (version.requirements ?? []).map((requirement) => requirement.actionName)
        )
      ),
      ...Object.values(volunteerRoles).flatMap((policy) =>
        (policy.policyVersions ?? []).flatMap((version) =>
          (version.requirements ?? []).map((requirement) => requirement.actionName)
        )
      ),
    ];

    const mapByValue = new Map<string, ActionOption>();
    configured.forEach((option) => mapByValue.set(option.value, option));
    fromPolicies.forEach((actionName) => {
      if (!mapByValue.has(actionName)) {
        mapByValue.set(actionName, { value: actionName, label: actionName });
      }
    });

    return [...mapByValue.values()].sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [effectiveLocationPolicy?.actionDefinitions, volunteerFamilyRoles, volunteerRoles]);

  const initialRows = useMemo(
    () =>
      buildRows(
        actionOptions,
        familyRoleMeta,
        individualRoleMeta,
        volunteerFamilyRoles,
        volunteerRoles
      ),
    [
      actionOptions,
      familyRoleMeta,
      individualRoleMeta,
      volunteerFamilyRoles,
      volunteerRoles,
    ]
  );

  const [rows, setRows] = useState<MatrixRow[]>(initialRows);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const canSave = canEdit;

  const save = async () => {
    await withBackdrop(async () => {
      const currentPolicy = await api.configuration.getEffectiveLocationPolicy(
        organizationId,
        locationId
      );

      const existingVolunteerPolicy =
        currentPolicy.volunteerPolicy ?? new VolunteerPolicy();

      const updatedFamilyRoles = {
        ...(existingVolunteerPolicy.volunteerFamilyRoles ?? {}),
      };
      const updatedIndividualRoles = {
        ...(existingVolunteerPolicy.volunteerRoles ?? {}),
      };

      familyRoleMeta.forEach((roleMeta) => {
        if (!roleMeta.hasVersion) return;

        const rolePolicy = updatedFamilyRoles[roleMeta.roleName];
        if (!rolePolicy) return;

        const selectedVersion = rolePolicy.policyVersions?.[roleMeta.versionIndex];
        if (!selectedVersion) return;

        const updatedRequirements = rows
          .filter((row) => row.familyScopes[roleMeta.roleName] !== '')
          .map(
            (row) =>
              new VolunteerFamilyApprovalRequirement({
                stage: row.stage,
                actionName: row.actionName,
                scope: row.familyScopes[
                  roleMeta.roleName
                ] as VolunteerFamilyRequirementScope,
              })
          );

        const updatedVersions = (rolePolicy.policyVersions ?? []).map(
          (version, index) =>
            index === roleMeta.versionIndex
              ? new VolunteerFamilyRolePolicyVersion({
                  ...selectedVersion,
                  requirements: updatedRequirements,
                })
              : version
        );

        updatedFamilyRoles[roleMeta.roleName] = new VolunteerFamilyRolePolicy({
          ...rolePolicy,
          policyVersions: updatedVersions,
        });
      });

      individualRoleMeta.forEach((roleMeta) => {
        if (!roleMeta.hasVersion) return;

        const rolePolicy = updatedIndividualRoles[roleMeta.roleName];
        if (!rolePolicy) return;

        const selectedVersion = rolePolicy.policyVersions?.[roleMeta.versionIndex];
        if (!selectedVersion) return;

        const updatedRequirements = rows
          .filter((row) => row.individualRequired[roleMeta.roleName])
          .map(
            (row) =>
              new VolunteerApprovalRequirement({
                stage: row.stage,
                actionName: row.actionName,
              })
          );

        const updatedVersions = (rolePolicy.policyVersions ?? []).map(
          (version, index) =>
            index === roleMeta.versionIndex
              ? new VolunteerRolePolicyVersion({
                  ...selectedVersion,
                  requirements: updatedRequirements,
                })
              : version
        );

        updatedIndividualRoles[roleMeta.roleName] = new VolunteerRolePolicy({
          ...rolePolicy,
          policyVersions: updatedVersions,
        });
      });

      const updatedVolunteerPolicy = new VolunteerPolicy({
        ...existingVolunteerPolicy,
        volunteerFamilyRoles: updatedFamilyRoles,
        volunteerRoles: updatedIndividualRoles,
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
    });
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Volunteer Roles Matrix
      </Typography>

      <Typography variant="body2" sx={{ mb: 2 }}>
        Actions are listed in order and cannot be changed here. This editor
        updates the active policy version for each role (first non-superseded
        version, or first version if all are superseded).
      </Typography>

      <TableContainer sx={{ overflowX: 'auto', mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell rowSpan={2}>Action</TableCell>
              <TableCell rowSpan={2}>Stage</TableCell>
              <TableCell align="center" colSpan={Math.max(familyRoleMeta.length, 1)}>
                Family Roles
              </TableCell>
              <TableCell
                align="center"
                colSpan={Math.max(individualRoleMeta.length, 1)}
              >
                Individual Roles
              </TableCell>
            </TableRow>
            <TableRow>
              {familyRoleMeta.length > 0 ? (
                familyRoleMeta.map((role) => (
                  <TableCell key={`family-${role.roleName}`}>
                    <Typography variant="body2">{role.roleName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {role.versionLabel}
                    </Typography>
                  </TableCell>
                ))
              ) : (
                <TableCell>-</TableCell>
              )}

              {individualRoleMeta.length > 0 ? (
                individualRoleMeta.map((role) => (
                  <TableCell key={`individual-${role.roleName}`}>
                    <Typography variant="body2">{role.roleName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {role.versionLabel}
                    </Typography>
                  </TableCell>
                ))
              ) : (
                <TableCell>-</TableCell>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell sx={{ minWidth: 260 }}>
                  <Typography variant="body2">{row.actionLabel}</Typography>
                </TableCell>

                <TableCell sx={{ minWidth: 160 }}>
                  <TextField
                    fullWidth
                    select
                    size="small"
                    value={row.stage}
                    onChange={(e) => {
                      const value = Number(e.target.value) as RequirementStage;
                      setRows((previous) =>
                        previous.map((x) =>
                          x.id === row.id ? { ...x, stage: value } : x
                        )
                      );
                    }}
                  >
                    {stageOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>

                {familyRoleMeta.length > 0 ? (
                  familyRoleMeta.map((role) => (
                    <TableCell key={`family-cell-${row.id}-${role.roleName}`}>
                      <TextField
                        fullWidth
                        select
                        size="small"
                        disabled={!role.hasVersion}
                        value={row.familyScopes[role.roleName] ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setRows((previous) =>
                            previous.map((x) =>
                              x.id === row.id
                                ? {
                                    ...x,
                                    familyScopes: {
                                      ...x.familyScopes,
                                      [role.roleName]:
                                        value === ''
                                          ? ''
                                          : (Number(
                                              value
                                            ) as VolunteerFamilyRequirementScope),
                                    },
                                  }
                                : x
                            )
                          );
                        }}
                      >
                        <MenuItem value="">-</MenuItem>
                        {scopeOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                  ))
                ) : (
                  <TableCell>-</TableCell>
                )}

                {individualRoleMeta.length > 0 ? (
                  individualRoleMeta.map((role) => (
                    <TableCell key={`individual-cell-${row.id}-${role.roleName}`}>
                      <TextField
                        fullWidth
                        select
                        size="small"
                        disabled={!role.hasVersion}
                        value={row.individualRequired[role.roleName] ? 'required' : ''}
                        onChange={(e) => {
                          const value = e.target.value === 'required';
                          setRows((previous) =>
                            previous.map((x) =>
                              x.id === row.id
                                ? {
                                    ...x,
                                    individualRequired: {
                                      ...x.individualRequired,
                                      [role.roleName]: value,
                                    },
                                  }
                                : x
                            )
                          );
                        }}
                      >
                        <MenuItem value="">-</MenuItem>
                        <MenuItem value="required">Required</MenuItem>
                      </TextField>
                    </TableCell>
                  ))
                ) : (
                  <TableCell>-</TableCell>
                )}
              </TableRow>
            ))}

            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={
                    2 +
                    Math.max(familyRoleMeta.length, 1) +
                    Math.max(individualRoleMeta.length, 1)
                  }
                >
                  <Typography variant="body2">No actions configured.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={save} disabled={!canSave}>
          Save matrix
        </Button>
      </Stack>
    </Box>
  );
}
