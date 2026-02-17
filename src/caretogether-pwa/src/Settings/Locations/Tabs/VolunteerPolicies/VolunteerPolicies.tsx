import {
  Box,
  Button,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { useSidePanel } from '../../../../Hooks/useSidePanel';
import { policyData } from '../../../../Model/ConfigurationModel';
import { useUserIsOrganizationAdministrator } from '../../../../Model/SessionModel';
import {
  RequirementStage,
  VolunteerFamilyRequirementScope,
  VolunteerFamilyRolePolicy,
  VolunteerRolePolicy,
} from '../../../../GeneratedClient';
import EditVolunteerPolicy, {
  ActionNameOption,
  VolunteerPolicyEditorData,
} from './EditVolunteerPolicy';
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridToolbar,
} from '@mui/x-data-grid';

type PolicyRow = {
  id: string;
  policyName: string;
  versionsCount: number;
  requirementsCount: number;
};

function summarizePolicy(policyName: string, requirementsByVersion: number[]): PolicyRow {
  return {
    id: policyName,
    policyName,
    versionsCount: requirementsByVersion.length,
    requirementsCount: requirementsByVersion.reduce((sum, x) => sum + x, 0),
  };
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toLocalDateTimeInputValue(date?: Date) {
  if (!date) return '';
  const asDate = new Date(date);
  if (Number.isNaN(asDate.getTime())) return '';

  const pad = (value: number) => String(value).padStart(2, '0');
  return `${asDate.getFullYear()}-${pad(asDate.getMonth() + 1)}-${pad(
    asDate.getDate()
  )}T${pad(asDate.getHours())}:${pad(asDate.getMinutes())}`;
}

function mapIndividualPolicyToEditorData(
  policyName: string,
  policy: VolunteerRolePolicy
): VolunteerPolicyEditorData {
  return {
    originalPolicyName: policyName,
    policyName,
    policyVersions:
      policy.policyVersions?.map((version) => ({
        id: createId(),
        version: version.version ?? '',
        supersededAtUtc: toLocalDateTimeInputValue(version.supersededAtUtc),
        requirements:
          version.requirements?.map((requirement) => ({
            id: createId(),
            stage:
              (requirement.stage ?? RequirementStage.Application) as RequirementStage,
            actionName: requirement.actionName,
          })) ?? [],
      })) ?? [],
  };
}

function mapFamilyPolicyToEditorData(
  policyName: string,
  policy: VolunteerFamilyRolePolicy
): VolunteerPolicyEditorData {
  return {
    originalPolicyName: policyName,
    policyName,
    policyVersions:
      policy.policyVersions?.map((version) => ({
        id: createId(),
        version: version.version ?? '',
        supersededAtUtc: toLocalDateTimeInputValue(version.supersededAtUtc),
        requirements:
          version.requirements?.map((requirement) => ({
            id: createId(),
            stage:
              (requirement.stage ?? RequirementStage.Application) as RequirementStage,
            actionName: requirement.actionName,
            scope:
              (requirement.scope ??
                VolunteerFamilyRequirementScope.OncePerFamily) as VolunteerFamilyRequirementScope,
          })) ?? [],
      })) ?? [],
  };
}

export default function VolunteerPolicies() {
  const effectiveLocationPolicy = useRecoilValue(policyData);
  const volunteerPolicy = effectiveLocationPolicy?.volunteerPolicy;
  const actionNameOptions = useMemo<ActionNameOption[]>(
    () =>
      Object.entries(effectiveLocationPolicy?.actionDefinitions ?? {}).map(
        ([name, definition]) => ({
          name,
          alternateNames: definition.alternateNames ?? [],
        })
      ),
    [effectiveLocationPolicy?.actionDefinitions]
  );

  const canEdit = useUserIsOrganizationAdministrator();

  const {
    SidePanel: SidePanelIndividual,
    openSidePanel: openIndividual,
    closeSidePanel: closeIndividual,
  } = useSidePanel();

  const {
    SidePanel: SidePanelFamily,
    openSidePanel: openFamily,
    closeSidePanel: closeFamily,
  } = useSidePanel();

  const [workingIndividualPolicy, setWorkingIndividualPolicy] =
    useState<VolunteerPolicyEditorData | null>(null);
  const [workingFamilyPolicy, setWorkingFamilyPolicy] =
    useState<VolunteerPolicyEditorData | null>(null);

  const individualRows = useMemo(
    () =>
      Object.entries(volunteerPolicy?.volunteerRoles ?? {}).map(
        ([policyName, policy]: [string, VolunteerRolePolicy]) =>
          summarizePolicy(
            policyName,
            policy.policyVersions?.map((x) => x.requirements?.length ?? 0) ?? []
          )
      ),
    [volunteerPolicy?.volunteerRoles]
  );

  const familyRows = useMemo(
    () =>
      Object.entries(volunteerPolicy?.volunteerFamilyRoles ?? {}).map(
        ([policyName, policy]: [string, VolunteerFamilyRolePolicy]) =>
          summarizePolicy(
            policyName,
            policy.policyVersions?.map((x) => x.requirements?.length ?? 0) ?? []
          )
      ),
    [volunteerPolicy?.volunteerFamilyRoles]
  );

  const columns = useMemo<GridColDef<PolicyRow>[]>(
    () => [
      { field: 'policyName', headerName: 'Policy Name', minWidth: 220, flex: 1 },
      {
        field: 'versionsCount',
        headerName: 'Policy Versions',
        type: 'number',
        minWidth: 150,
        flex: 0.7,
      },
      {
        field: 'requirementsCount',
        headerName: 'Total Requirements',
        type: 'number',
        minWidth: 170,
        flex: 0.8,
      },
    ],
    []
  );

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Volunteer Policies
      </Typography>

      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Individual Volunteer Role Policies
      </Typography>

      <Box sx={{ width: '100%', mb: 1 }}>
        <DataGrid
          autoHeight
          rows={individualRows}
          columns={columns}
          pagination
          pageSize={5}
          rowsPerPageOptions={[5, 10, 25]}
          disableSelectionOnClick
          components={{ Toolbar: GridToolbar }}
          componentsProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 300 },
            },
          }}
          localeText={{
            noRowsLabel: 'No individual volunteer role policies yet.',
          }}
          initialState={{
            sorting: {
              sortModel: [{ field: 'policyName', sort: 'asc' }],
            },
          }}
          onRowClick={(params: GridRowParams<PolicyRow>) => {
            if (!canEdit) return;
            const policy = volunteerPolicy?.volunteerRoles?.[params.row.policyName];
            if (!policy) return;
            setWorkingIndividualPolicy(
              mapIndividualPolicyToEditorData(params.row.policyName, policy)
            );
            openIndividual();
          }}
          sx={{
            '& .MuiDataGrid-row': {
              cursor: canEdit ? 'pointer' : 'default',
            },
          }}
        />
      </Box>

      {canEdit && (
        <Button
          sx={{ mb: 3 }}
          variant="contained"
          onClick={() => {
            setWorkingIndividualPolicy(null);
            openIndividual();
          }}
        >
          Add individual volunteer role policy
        </Button>
      )}

      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Volunteer Family Role Policies
      </Typography>

      <Box sx={{ width: '100%', mb: 1 }}>
        <DataGrid
          autoHeight
          rows={familyRows}
          columns={columns}
          pagination
          pageSize={5}
          rowsPerPageOptions={[5, 10, 25]}
          disableSelectionOnClick
          components={{ Toolbar: GridToolbar }}
          componentsProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 300 },
            },
          }}
          localeText={{
            noRowsLabel: 'No volunteer family role policies yet.',
          }}
          initialState={{
            sorting: {
              sortModel: [{ field: 'policyName', sort: 'asc' }],
            },
          }}
          onRowClick={(params: GridRowParams<PolicyRow>) => {
            if (!canEdit) return;
            const policy =
              volunteerPolicy?.volunteerFamilyRoles?.[params.row.policyName];
            if (!policy) return;
            setWorkingFamilyPolicy(
              mapFamilyPolicyToEditorData(params.row.policyName, policy)
            );
            openFamily();
          }}
          sx={{
            '& .MuiDataGrid-row': {
              cursor: canEdit ? 'pointer' : 'default',
            },
          }}
        />
      </Box>

      {canEdit && (
        <Button
          sx={{ mb: 2 }}
          variant="contained"
          onClick={() => {
            setWorkingFamilyPolicy(null);
            openFamily();
          }}
        >
          Add volunteer family role policy
        </Button>
      )}

      <SidePanelIndividual>
        <EditVolunteerPolicy
          type="individual"
          data={workingIndividualPolicy ?? undefined}
          actionNameOptions={actionNameOptions}
          onClose={() => {
            closeIndividual();
          }}
        />
      </SidePanelIndividual>

      <SidePanelFamily>
        <EditVolunteerPolicy
          type="family"
          data={workingFamilyPolicy ?? undefined}
          actionNameOptions={actionNameOptions}
          onClose={() => {
            closeFamily();
          }}
        />
      </SidePanelFamily>
    </Box>
  );
}
