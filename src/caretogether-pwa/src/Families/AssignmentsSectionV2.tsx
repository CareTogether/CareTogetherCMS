import Grid from '../Generic/GridLegacyCompat';
import { Stack, Typography } from '@mui/material';
import { CombinedFamilyInfo } from '../GeneratedClient';
import { accountInfoState } from '../Authentication/Auth';
import { ActiveFiltersAlert } from '../Generic/ActiveFiltersAlert';
import { useScopedDataGridFilterPreferences } from '../Hooks/useScopedDataGridFilterPreferences';
import {
  useFamilyLookup,
  usePersonAndFamilyLookup,
} from '../Model/DirectoryModel';
import { useMemo } from 'react';
import { useLoadable } from '../Hooks/useLoadable';
import { partneringFamiliesData } from '../Model/V1CasesModel';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { VolunteerAssignmentsDataGridV2 } from './VolunteerAssignmentsDataGridV2';
import { volunteerAssignmentsDataGridColumns } from './volunteerAssignmentsDataGridColumnsV2';
import {
  allArrangements,
  buildVolunteerAssignmentRowsV2,
} from './volunteerAssignmentViewModel';
import { familyNameString } from './FamilyName';
import { personNameString } from './PersonName';

interface AssignmentsSectionProps {
  family: CombinedFamilyInfo;
  hideTitle?: boolean;
  locationId: string;
  organizationId: string;
}

export function AssignmentsSection({
  family,
  hideTitle = false,
  locationId,
  organizationId,
}: AssignmentsSectionProps) {
  const personAndFamilyLookup = usePersonAndFamilyLookup();
  const familyLookup = useFamilyLookup();
  const partneringFamilies = useLoadable(partneringFamiliesData);
  const accountInfo = useLoadable(accountInfoState);
  const navigate = useAppNavigate();

  const assignments = useMemo(
    () =>
      [...(family.volunteerFamilyInfo?.assignments ?? [])].sort((a, b) => {
        const dateA = a.startedAtUtc?.getTime() ?? 0;
        const dateB = b.startedAtUtc?.getTime() ?? 0;
        return dateB - dateA;
      }),
    [family.volunteerFamilyInfo?.assignments]
  );

  const assignmentRows = useMemo(
    () =>
      buildVolunteerAssignmentRowsV2({
        assignments,
        childFamilyIdForAssignment: (assignment) =>
          partneringFamilies?.find(
            (fam) =>
              fam.partneringFamilyInfo &&
              allArrangements(fam.partneringFamilyInfo).some(
                (entry) => entry.arrangement.id === assignment.id
              )
          )?.family?.id,
        familyLabel: (familyId) => {
          const matchedFamily = familyLookup(familyId);
          return matchedFamily ? familyNameString(matchedFamily) : undefined;
        },
        personLabel: (personId) => {
          const personInfo = personId ? personAndFamilyLookup(personId) : null;
          return personInfo?.person
            ? personNameString(personInfo.person)
            : undefined;
        },
      }),
    [assignments, familyLookup, partneringFamilies, personAndFamilyLookup]
  );
  const columns = useMemo(() => volunteerAssignmentsDataGridColumns(), []);
  const {
    clearFilters,
    filterModel,
    hasActiveFilters,
    onFilterModelChange,
  } = useScopedDataGridFilterPreferences({
    columns,
    namespace: 'volunteer-assignments-grid-filters',
    scope: {
      entityId: family.family?.id,
      locationId,
      organizationId,
      userId: accountInfo?.userId,
    },
  });

  if (assignments.length === 0) return null;

  return (
    <Grid item xs={12}>
      <Stack spacing={1}>
        {!hideTitle && (
          <Typography variant="h3" sx={{ marginBottom: 1 }}>
            Assignments
          </Typography>
        )}
        {hasActiveFilters && <ActiveFiltersAlert onClear={clearFilters} />}
        <VolunteerAssignmentsDataGridV2
          columns={columns}
          filterModel={filterModel}
          rows={assignmentRows}
          onFilterModelChange={onFilterModelChange}
          onRowClick={(row) => {
            if (row.childFamilyId) navigate.family(row.childFamilyId);
          }}
        />
      </Stack>
    </Grid>
  );
}
