import { Accordion, AccordionDetails, AccordionSummary, Box, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ReactNode, useState } from 'react';
import { CustomField, EffectiveLocationPolicy, RequirementStage, VolunteerFamilyRequirementScope, VolunteerFamilyRolePolicyVersion, VolunteerPolicy, VolunteerRolePolicyVersion } from '../../../../GeneratedClient';
import { useSidePanel } from '../../../../Hooks/useSidePanel';
import { CustomFieldsTable } from './CustomFieldsTable';
import { CustomFieldSidePanel, DeleteRowAction, DuplicateRowAction, EditableActions, EmptyRow, SectionHeader, VolunteerRolePolicyVersionSidePanel, clonePolicyWithVolunteerCustomFields, clonePolicyWithVolunteerPolicy, enumName, formatDate, nextCopyName, removeCustomField, removeVolunteerFamilyRolePolicyVersion, removeVolunteerRolePolicyVersion, upsertCustomField, upsertVolunteerFamilyRolePolicyVersion, upsertVolunteerRolePolicyVersion } from './shared';

function RolePolicyVersionsTable({
  rows,
  family,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  rows: {
    roleName: string;
    version: string;
    supersededAtUtc?: Date;
    requirements: ReactNode;
    policyVersion:
      | VolunteerRolePolicyVersion
      | VolunteerFamilyRolePolicyVersion;
  }[];
  family?: boolean;
  onEdit?: (row: {
    roleName: string;
    version: string;
    supersededAtUtc?: Date;
    requirements: ReactNode;
    policyVersion:
      | VolunteerRolePolicyVersion
      | VolunteerFamilyRolePolicyVersion;
  }) => void;
  onDuplicate?: (row: {
    roleName: string;
    version: string;
    supersededAtUtc?: Date;
    requirements: ReactNode;
    policyVersion:
      | VolunteerRolePolicyVersion
      | VolunteerFamilyRolePolicyVersion;
  }) => void;
  onDelete?: (row: {
    roleName: string;
    version: string;
    supersededAtUtc?: Date;
    requirements: ReactNode;
    policyVersion:
      | VolunteerRolePolicyVersion
      | VolunteerFamilyRolePolicyVersion;
  }) => void;
}) {
  const hasActions = Boolean(onDuplicate || onDelete);

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>
              {family ? 'Volunteer Family Role Type' : 'Volunteer Role Type'}
            </TableCell>
            <TableCell>Version</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Requirements</TableCell>
            {hasActions && <TableCell align="right">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <EmptyRow
              colSpan={hasActions ? 5 : 4}
              label="No role policies configured."
            />
          ) : (
            rows.map((row) => (
              <TableRow
                key={`${row.roleName}-${row.version}`}
                hover={Boolean(onEdit)}
                sx={onEdit ? { cursor: 'pointer' } : undefined}
                onClick={() => onEdit?.(row)}
              >
                <TableCell>{row.roleName}</TableCell>
                <TableCell>{row.version}</TableCell>
                <TableCell>{formatDate(row.supersededAtUtc)}</TableCell>
                <TableCell>{row.requirements}</TableCell>
                {hasActions && (
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{ justifyContent: 'flex-end' }}
                    >
                      {onDuplicate && (
                        <DuplicateRowAction
                          label={`${row.roleName} ${row.version}`}
                          onClick={() => onDuplicate(row)}
                        />
                      )}
                      {onDelete && (
                        <DeleteRowAction
                          label={`${row.roleName} ${row.version}`}
                          onClick={() => onDelete(row)}
                        />
                      )}
                    </Stack>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function VolunteerPolicyTab({
  policy,
  onPolicyChange,
}: {
  policy: EffectiveLocationPolicy;
  onPolicyChange: (policy: EffectiveLocationPolicy) => void;
}) {
  const volunteerPolicy: VolunteerPolicy | undefined = policy.volunteerPolicy;
  const customFields = volunteerPolicy?.customFields ?? [];
  const actionNames = Object.keys(policy.actionDefinitions ?? {});
  const {
    SidePanel: CustomFieldPanel,
    openSidePanel,
    closeSidePanel,
  } = useSidePanel();
  const {
    SidePanel: VolunteerRolePanel,
    openSidePanel: openVolunteerRolePanel,
    closeSidePanel: closeVolunteerRolePanel,
  } = useSidePanel();
  const {
    SidePanel: VolunteerFamilyRolePanel,
    openSidePanel: openVolunteerFamilyRolePanel,
    closeSidePanel: closeVolunteerFamilyRolePanel,
  } = useSidePanel();
  const [workingField, setWorkingField] = useState<CustomField | undefined>();
  const [workingVolunteerRoleVersion, setWorkingVolunteerRoleVersion] =
    useState<
      { roleName?: string; version?: VolunteerRolePolicyVersion } | undefined
    >();
  const [
    workingVolunteerFamilyRoleVersion,
    setWorkingVolunteerFamilyRoleVersion,
  ] = useState<
    | { roleName?: string; version?: VolunteerFamilyRolePolicyVersion }
    | undefined
  >();

  const individualRows = Object.entries(
    volunteerPolicy?.volunteerRoles ?? {}
  ).flatMap(
    ([roleName, rolePolicy]) =>
      rolePolicy.policyVersions?.map((version) => ({
        roleName,
        version: version.version,
        supersededAtUtc: version.supersededAtUtc,
        policyVersion: version,
        requirements: (
          <Stack spacing={0.5}>
            {version.requirements?.length ? (
              version.requirements.map((requirement) => (
                <Typography
                  key={`${requirement.stage}-${requirement.actionName}`}
                  variant="body2"
                >
                  {enumName(RequirementStage, requirement.stage)} -{' '}
                  {requirement.actionName}
                </Typography>
              ))
            ) : (
              <Typography variant="body2">-</Typography>
            )}
          </Stack>
        ),
      })) ?? []
  );

  const familyRows = Object.entries(
    volunteerPolicy?.volunteerFamilyRoles ?? {}
  ).flatMap(
    ([roleName, rolePolicy]) =>
      rolePolicy.policyVersions?.map((version) => ({
        roleName,
        version: version.version,
        supersededAtUtc: version.supersededAtUtc,
        policyVersion: version,
        requirements: (
          <Stack spacing={0.5}>
            {version.requirements?.length ? (
              version.requirements.map((requirement) => (
                <Typography
                  key={`${requirement.stage}-${requirement.actionName}-${requirement.scope}`}
                  variant="body2"
                >
                  {enumName(RequirementStage, requirement.stage)} -{' '}
                  {requirement.actionName} -{' '}
                  {enumName(VolunteerFamilyRequirementScope, requirement.scope)}
                </Typography>
              ))
            ) : (
              <Typography variant="body2">-</Typography>
            )}
          </Stack>
        ),
      })) ?? []
  );

  function duplicateVolunteerCustomField(field: CustomField) {
    onPolicyChange(
      clonePolicyWithVolunteerCustomFields(
        policy,
        upsertCustomField(
          customFields,
          undefined,
          new CustomField({
            ...field,
            name: nextCopyName(
              field.name,
              customFields.map((item) => item.name)
            ),
          })
        )
      )
    );
  }

  function deleteVolunteerCustomField(field: CustomField) {
    onPolicyChange(
      clonePolicyWithVolunteerCustomFields(
        policy,
        removeCustomField(customFields, field.name)
      )
    );
  }

  function duplicateVolunteerRoleVersion(row: {
    roleName: string;
    version: string;
    policyVersion:
      | VolunteerRolePolicyVersion
      | VolunteerFamilyRolePolicyVersion;
  }) {
    const existingVersions =
      volunteerPolicy?.volunteerRoles?.[row.roleName]?.policyVersions?.map(
        (version) => version.version
      ) ?? [];
    onPolicyChange(
      clonePolicyWithVolunteerPolicy(
        policy,
        upsertVolunteerRolePolicyVersion(
          volunteerPolicy,
          undefined,
          undefined,
          row.roleName,
          new VolunteerRolePolicyVersion({
            ...(row.policyVersion as VolunteerRolePolicyVersion),
            version: nextCopyName(row.version, existingVersions),
          })
        )
      )
    );
  }

  function duplicateVolunteerFamilyRoleVersion(row: {
    roleName: string;
    version: string;
    policyVersion:
      | VolunteerRolePolicyVersion
      | VolunteerFamilyRolePolicyVersion;
  }) {
    const existingVersions =
      volunteerPolicy?.volunteerFamilyRoles?.[
        row.roleName
      ]?.policyVersions?.map((version) => version.version) ?? [];
    onPolicyChange(
      clonePolicyWithVolunteerPolicy(
        policy,
        upsertVolunteerFamilyRolePolicyVersion(
          volunteerPolicy,
          undefined,
          undefined,
          row.roleName,
          new VolunteerFamilyRolePolicyVersion({
            ...(row.policyVersion as VolunteerFamilyRolePolicyVersion),
            version: nextCopyName(row.version, existingVersions),
          })
        )
      )
    );
  }

  function deleteVolunteerRoleVersion(row: {
    roleName: string;
    version: string;
  }) {
    onPolicyChange(
      clonePolicyWithVolunteerPolicy(
        policy,
        removeVolunteerRolePolicyVersion(
          volunteerPolicy,
          row.roleName,
          row.version
        )
      )
    );
  }

  function deleteVolunteerFamilyRoleVersion(row: {
    roleName: string;
    version: string;
  }) {
    onPolicyChange(
      clonePolicyWithVolunteerPolicy(
        policy,
        removeVolunteerFamilyRolePolicyVersion(
          volunteerPolicy,
          row.roleName,
          row.version
        )
      )
    );
  }

  return (
    <Box>
      <SectionHeader title="Volunteer Policies" />

      <Stack spacing={2}>
        <Accordion defaultExpanded variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Volunteer Roles</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <EditableActions
                onAdd={() => {
                  setWorkingVolunteerRoleVersion(undefined);
                  openVolunteerRolePanel();
                }}
              />
              <RolePolicyVersionsTable
                rows={individualRows}
                onEdit={(row) => {
                  setWorkingVolunteerRoleVersion({
                    roleName: row.roleName,
                    version: row.policyVersion as VolunteerRolePolicyVersion,
                  });
                  openVolunteerRolePanel();
                }}
                onDuplicate={duplicateVolunteerRoleVersion}
                onDelete={deleteVolunteerRoleVersion}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Volunteer Family Roles</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <EditableActions
                onAdd={() => {
                  setWorkingVolunteerFamilyRoleVersion(undefined);
                  openVolunteerFamilyRolePanel();
                }}
              />
              <RolePolicyVersionsTable
                rows={familyRows}
                family
                onEdit={(row) => {
                  setWorkingVolunteerFamilyRoleVersion({
                    roleName: row.roleName,
                    version:
                      row.policyVersion as VolunteerFamilyRolePolicyVersion,
                  });
                  openVolunteerFamilyRolePanel();
                }}
                onDuplicate={duplicateVolunteerFamilyRoleVersion}
                onDelete={deleteVolunteerFamilyRoleVersion}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Custom Fields</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <EditableActions
                onAdd={() => {
                  setWorkingField(undefined);
                  openSidePanel();
                }}
              />
              <CustomFieldsTable
                fields={customFields}
                onEdit={(field) => {
                  setWorkingField(field);
                  openSidePanel();
                }}
                onDuplicate={duplicateVolunteerCustomField}
                onDelete={deleteVolunteerCustomField}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>

      <CustomFieldPanel>
        <CustomFieldSidePanel
          key={workingField?.name ?? 'new-volunteer-custom-field'}
          title={
            workingField
              ? 'Edit Volunteer Policies Custom Field'
              : 'Add Volunteer Policies Custom Field'
          }
          field={workingField}
          existingNames={customFields.map((field) => field.name)}
          onClose={closeSidePanel}
          onSave={(previousName, field) => {
            onPolicyChange(
              clonePolicyWithVolunteerCustomFields(
                policy,
                upsertCustomField(customFields, previousName, field)
              )
            );
            closeSidePanel();
          }}
        />
      </CustomFieldPanel>

      <VolunteerRolePanel>
        <VolunteerRolePolicyVersionSidePanel
          key={`${workingVolunteerRoleVersion?.roleName ?? 'new-volunteer-role'}-${workingVolunteerRoleVersion?.version?.version ?? 'version'}`}
          title={
            workingVolunteerRoleVersion
              ? 'Edit Volunteer Policies Role Version'
              : 'Add Volunteer Policies Role Version'
          }
          roleName={workingVolunteerRoleVersion?.roleName}
          version={workingVolunteerRoleVersion?.version}
          existingRoleNames={Object.keys(volunteerPolicy?.volunteerRoles ?? {})}
          existingVersionsForRole={
            workingVolunteerRoleVersion?.roleName
              ? (volunteerPolicy?.volunteerRoles?.[
                  workingVolunteerRoleVersion.roleName
                ]?.policyVersions?.map((version) => version.version) ?? [])
              : []
          }
          family={false}
          actionNames={actionNames}
          onClose={closeVolunteerRolePanel}
          onSave={(previousRoleName, previousVersion, roleName, version) => {
            onPolicyChange(
              clonePolicyWithVolunteerPolicy(
                policy,
                upsertVolunteerRolePolicyVersion(
                  volunteerPolicy,
                  previousRoleName,
                  previousVersion,
                  roleName,
                  version as VolunteerRolePolicyVersion
                )
              )
            );
            closeVolunteerRolePanel();
          }}
        />
      </VolunteerRolePanel>

      <VolunteerFamilyRolePanel>
        <VolunteerRolePolicyVersionSidePanel
          key={`${workingVolunteerFamilyRoleVersion?.roleName ?? 'new-volunteer-family-role'}-${workingVolunteerFamilyRoleVersion?.version?.version ?? 'version'}`}
          title={
            workingVolunteerFamilyRoleVersion
              ? 'Edit Volunteer Policies Family Role Version'
              : 'Add Volunteer Policies Family Role Version'
          }
          roleName={workingVolunteerFamilyRoleVersion?.roleName}
          version={workingVolunteerFamilyRoleVersion?.version}
          existingRoleNames={Object.keys(
            volunteerPolicy?.volunteerFamilyRoles ?? {}
          )}
          existingVersionsForRole={
            workingVolunteerFamilyRoleVersion?.roleName
              ? (volunteerPolicy?.volunteerFamilyRoles?.[
                  workingVolunteerFamilyRoleVersion.roleName
                ]?.policyVersions?.map((version) => version.version) ?? [])
              : []
          }
          family
          actionNames={actionNames}
          onClose={closeVolunteerFamilyRolePanel}
          onSave={(previousRoleName, previousVersion, roleName, version) => {
            onPolicyChange(
              clonePolicyWithVolunteerPolicy(
                policy,
                upsertVolunteerFamilyRolePolicyVersion(
                  volunteerPolicy,
                  previousRoleName,
                  previousVersion,
                  roleName,
                  version as VolunteerFamilyRolePolicyVersion
                )
              )
            );
            closeVolunteerFamilyRolePanel();
          }}
        />
      </VolunteerFamilyRolePanel>
    </Box>
  );
}
