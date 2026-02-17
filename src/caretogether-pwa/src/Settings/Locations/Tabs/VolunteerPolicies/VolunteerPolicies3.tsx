import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { useSearchParams } from 'react-router-dom';
import { policyData } from '../../../../Model/ConfigurationModel';
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

type PolicyType = 'individual' | 'family';

type PolicyRow = {
  policyName: string;
  versionsCount: number;
  requirementsCount: number;
};

function summarizePolicy(
  policyName: string,
  requirementsByVersion: number[]
): PolicyRow {
  return {
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
              (requirement.stage ??
                RequirementStage.Application) as RequirementStage,
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
              (requirement.stage ??
                RequirementStage.Application) as RequirementStage,
            actionName: requirement.actionName,
            scope:
              (requirement.scope ??
                VolunteerFamilyRequirementScope.OncePerFamily) as VolunteerFamilyRequirementScope,
          })) ?? [],
      })) ?? [],
  };
}

export default function VolunteerPolicies3() {
  const effectiveLocationPolicy = useRecoilValue(policyData);
  const volunteerPolicy = effectiveLocationPolicy?.volunteerPolicy;
  const [searchParams, setSearchParams] = useSearchParams();

  const actionNameOptions = useMemo<ActionNameOption[]>(
    () =>
      Object.entries(effectiveLocationPolicy?.actionDefinitions ?? {})
        .map(([name, definition]) => ({
          name,
          alternateNames: definition.alternateNames ?? [],
        })),
    [effectiveLocationPolicy?.actionDefinitions]
  );

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

  const mode = searchParams.get('vp3Mode');
  const policyType = searchParams.get('vp3Type') as PolicyType | null;
  const policyName = searchParams.get('vp3Name');

  const openList = () => {
    setSearchParams({ tab: 'volunteerPolicies3' });
  };

  const openCreate = (type: PolicyType) => {
    setSearchParams({
      tab: 'volunteerPolicies3',
      vp3Mode: 'new',
      vp3Type: type,
    });
  };

  const openEdit = (type: PolicyType, name: string) => {
    setSearchParams({
      tab: 'volunteerPolicies3',
      vp3Mode: 'edit',
      vp3Type: type,
      vp3Name: name,
    });
  };

  if (mode === 'new' && policyType) {
    return (
      <Box>
        <Button sx={{ mb: 2 }} onClick={openList}>
          Back to Volunteer Policies 3
        </Button>

        <EditVolunteerPolicy
          type={policyType}
          actionNameOptions={actionNameOptions}
          onClose={openList}
        />
      </Box>
    );
  }

  if (mode === 'edit' && policyType && policyName) {
    const policyDataForEditor =
      policyType === 'individual'
        ? volunteerPolicy?.volunteerRoles?.[policyName] &&
          mapIndividualPolicyToEditorData(
            policyName,
            volunteerPolicy.volunteerRoles[policyName]
          )
        : volunteerPolicy?.volunteerFamilyRoles?.[policyName] &&
          mapFamilyPolicyToEditorData(
            policyName,
            volunteerPolicy.volunteerFamilyRoles[policyName]
          );

    if (!policyDataForEditor) {
      return (
        <Box>
          <Button sx={{ mb: 2 }} onClick={openList}>
            Back to Volunteer Policies 3
          </Button>
          <Typography>Policy not found.</Typography>
        </Box>
      );
    }

    return (
      <Box>
        <Button sx={{ mb: 2 }} onClick={openList}>
          Back to Volunteer Policies 3
        </Button>

        <EditVolunteerPolicy
          type={policyType}
          data={policyDataForEditor}
          actionNameOptions={actionNameOptions}
          onClose={openList}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Volunteer Policies 3
      </Typography>

      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Individual Volunteer Role Policies
      </Typography>

      <TableContainer sx={{ mb: 1 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Policy Name</TableCell>
              <TableCell>Policy Versions</TableCell>
              <TableCell>Total Requirements</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {individualRows.map((row) => (
              <TableRow
                key={row.policyName}
                sx={{ cursor: 'pointer' }}
                onClick={() => openEdit('individual', row.policyName)}
              >
                <TableCell>{row.policyName}</TableCell>
                <TableCell>{row.versionsCount}</TableCell>
                <TableCell>{row.requirementsCount}</TableCell>
              </TableRow>
            ))}

            {individualRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography variant="body2">
                    No individual volunteer role policies yet.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Button sx={{ mb: 3 }} variant="contained" onClick={() => openCreate('individual')}>
        Add individual volunteer role policy
      </Button>

      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Volunteer Family Role Policies
      </Typography>

      <TableContainer sx={{ mb: 1 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Policy Name</TableCell>
              <TableCell>Policy Versions</TableCell>
              <TableCell>Total Requirements</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {familyRows.map((row) => (
              <TableRow
                key={row.policyName}
                sx={{ cursor: 'pointer' }}
                onClick={() => openEdit('family', row.policyName)}
              >
                <TableCell>{row.policyName}</TableCell>
                <TableCell>{row.versionsCount}</TableCell>
                <TableCell>{row.requirementsCount}</TableCell>
              </TableRow>
            ))}

            {familyRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography variant="body2">
                    No volunteer family role policies yet.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Button variant="contained" onClick={() => openCreate('family')}>
        Add volunteer family role policy
      </Button>
    </Box>
  );
}
