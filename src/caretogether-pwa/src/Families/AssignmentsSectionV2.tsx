import Grid from '../Generic/GridLegacyCompat';
import { Typography } from '@mui/material';
import { CombinedFamilyInfo } from '../GeneratedClient';
import {
  useFamilyLookup,
  usePersonAndFamilyLookup,
} from '../Model/DirectoryModel';
import { useMemo } from 'react';
import { useLoadable } from '../Hooks/useLoadable';
import { partneringFamiliesData } from '../Model/V1CasesModel';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { VolunteerAssignmentsDataGridV2 } from './VolunteerAssignmentsDataGridV2';
import {
  allArrangements,
  buildVolunteerAssignmentRowsV2,
} from './volunteerAssignmentViewModel';
import { familyNameString } from './FamilyName';
import { personNameString } from './PersonName';

interface AssignmentsSectionProps {
  family: CombinedFamilyInfo;
  hideTitle?: boolean;
}

export function AssignmentsSection({
  family,
  hideTitle = false,
}: AssignmentsSectionProps) {
  const personAndFamilyLookup = usePersonAndFamilyLookup();
  const familyLookup = useFamilyLookup();
  const partneringFamilies = useLoadable(partneringFamiliesData);
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

  if (assignments.length === 0) return null;

  return (
    <Grid item xs={12}>
      {!hideTitle && (
        <Typography variant="h3" sx={{ marginBottom: 2 }}>
          Assignments
        </Typography>
      )}
      <VolunteerAssignmentsDataGridV2
        rows={assignmentRows}
        onRowClick={(row) => {
          if (row.childFamilyId) navigate.family(row.childFamilyId);
        }}
      />
    </Grid>
  );
}
