import {
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  EffectiveLocationPolicy,
  OrganizationRolePolicyVersion,
  RequirementStage,
} from '../../../../GeneratedClient';
import { useSidePanel } from '../../../../Hooks/useSidePanel';
import {
  clonePolicyWithOrganizationApprovalPolicy,
  DeleteRowAction,
  DuplicateRowAction,
  EditableActions,
  EmptyRow,
  enumName,
  formatDate,
  nextCopyName,
  removeOrganizationRolePolicyVersion,
  SectionHeader,
  upsertOrganizationRolePolicyVersion,
  VolunteerRolePolicyVersionSidePanel,
} from './shared';

type OrganizationRoleVersionRow = {
  roleName: string;
  version: OrganizationRolePolicyVersion;
};

export function OrganizationPolicyTab({
  policy,
  onPolicyChange,
}: {
  policy: EffectiveLocationPolicy;
  onPolicyChange: (policy: EffectiveLocationPolicy) => void;
}) {
  const organizationPolicy = policy.organizationApprovalPolicy;
  const rows = Object.entries(organizationPolicy?.organizationRoles ?? {})
    .flatMap(([roleName, role]) =>
      (role.policyVersions ?? []).map((version) => ({ roleName, version }))
    )
    .sort((left, right) => left.roleName.localeCompare(right.roleName));
  const [workingRow, setWorkingRow] = useState<
    OrganizationRoleVersionRow | undefined
  >();
  const { SidePanel, openSidePanel, closeSidePanel } = useSidePanel();

  function saveVersion(
    previousRoleName: string | undefined,
    previousVersion: string | undefined,
    roleName: string,
    version: OrganizationRolePolicyVersion
  ) {
    onPolicyChange(
      clonePolicyWithOrganizationApprovalPolicy(
        policy,
        upsertOrganizationRolePolicyVersion(
          organizationPolicy,
          previousRoleName,
          previousVersion,
          roleName,
          version
        )
      )
    );
    closeSidePanel();
  }

  function duplicate(row: OrganizationRoleVersionRow) {
    const existingVersions =
      organizationPolicy?.organizationRoles?.[row.roleName]?.policyVersions.map(
        (version) => version.version
      ) ?? [];
    saveVersion(
      undefined,
      undefined,
      row.roleName,
      new OrganizationRolePolicyVersion({
        ...row.version,
        version: nextCopyName(row.version.version, existingVersions),
      })
    );
  }

  function remove(row: OrganizationRoleVersionRow) {
    onPolicyChange(
      clonePolicyWithOrganizationApprovalPolicy(
        policy,
        removeOrganizationRolePolicyVersion(
          organizationPolicy,
          row.roleName,
          row.version.version
        )
      )
    );
  }

  return (
    <Box>
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <SectionHeader
          title="Organization approval roles"
          actions={
            <EditableActions
              onAdd={() => {
                setWorkingRow(undefined);
                openSidePanel();
              }}
            />
          }
        >
          <Typography color="text.secondary" variant="body2">
            Define the application, approval, and onboarding actions an
            Organization completes once for each role.
          </Typography>
        </SectionHeader>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Organization role</TableCell>
                <TableCell>Version</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requirements</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <EmptyRow
                  colSpan={5}
                  label="No Organization roles configured."
                />
              ) : (
                rows.map((row) => (
                  <TableRow
                    hover
                    key={`${row.roleName}-${row.version.version}`}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setWorkingRow(row);
                      openSidePanel();
                    }}
                  >
                    <TableCell>{row.roleName}</TableCell>
                    <TableCell>{row.version.version}</TableCell>
                    <TableCell>
                      {formatDate(row.version.supersededAtUtc)}
                    </TableCell>
                    <TableCell>
                      <Stack
                        direction="row"
                        spacing={0.75}
                        useFlexGap
                        sx={{ flexWrap: 'wrap' }}
                      >
                        {row.version.requirements.map((requirement) => (
                          <Chip
                            key={`${requirement.stage}-${requirement.actionName}`}
                            size="small"
                            variant="outlined"
                            label={`${enumName(RequirementStage, requirement.stage)} · ${requirement.actionName}`}
                          />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <DuplicateRowAction
                        label={`${row.roleName} ${row.version.version}`}
                        onClick={() => duplicate(row)}
                      />
                      <DeleteRowAction
                        label={`${row.roleName} ${row.version.version}`}
                        onClick={() => remove(row)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <SidePanel>
        <VolunteerRolePolicyVersionSidePanel
          key={`${workingRow?.roleName ?? 'new-organization-role'}-${workingRow?.version.version ?? 'version'}`}
          title={
            workingRow
              ? 'Edit Organization Role Version'
              : 'Add Organization Role Version'
          }
          roleName={workingRow?.roleName}
          version={workingRow?.version}
          existingRoleNames={Object.keys(
            organizationPolicy?.organizationRoles ?? {}
          )}
          existingVersionsForRole={
            workingRow
              ? (organizationPolicy?.organizationRoles?.[
                  workingRow.roleName
                ]?.policyVersions.map((version) => version.version) ?? [])
              : []
          }
          family={false}
          organization
          actionNames={Object.keys(policy.actionDefinitions ?? {})}
          onClose={closeSidePanel}
          onSave={(previousRoleName, previousVersion, roleName, version) =>
            saveVersion(
              previousRoleName,
              previousVersion,
              roleName,
              version as OrganizationRolePolicyVersion
            )
          }
        />
      </SidePanel>
    </Box>
  );
}
