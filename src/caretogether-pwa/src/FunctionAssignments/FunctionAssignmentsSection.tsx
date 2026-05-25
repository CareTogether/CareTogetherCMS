import { Fragment, useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import {
  Autocomplete,
  Box,
  Button,
  Drawer,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  CombinedFamilyInfo,
  Person,
  RoleApprovalStatus,
  AssignedIndividualVolunteer,
  FunctionAssignmentPolicy,
} from '../GeneratedClient';
import { visibleFamiliesQuery } from '../Model/Data';
import { familyNameString } from '../Families/FamilyName';
import { personNameString } from '../Families/PersonName';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useAppNavigate } from '../Hooks/useAppNavigate';

type FunctionAssignmentCandidate = {
  personId: string;
  familyId?: string;
  familyName: string;
  label: string;
  candidateType: FunctionAssignmentCandidateType;
};

type PersonDirectoryEntry = {
  person: Person;
  familyId: string;
  familyName: string;
};

type FunctionAssignmentCandidateType = 'Individuals' | 'Families';

type FunctionAssignmentsSectionProps = {
  title?: string;
  assignments: AssignedIndividualVolunteer[];
  policies: FunctionAssignmentPolicy[];
  canEdit: boolean;
  onAssign: (personId: string, assignmentRole: string) => Promise<void>;
  onUnassign: (personId: string, assignmentRole: string) => Promise<void>;
};

function isApprovedOrOnboarded(status?: RoleApprovalStatus) {
  return (
    status === RoleApprovalStatus.Approved ||
    status === RoleApprovalStatus.Onboarded
  );
}

function containsAny(values: string[] | undefined, expected: string[]) {
  return expected.some((value) => values?.includes(value));
}

function candidateTypeForPolicy(
  candidate: FunctionAssignmentCandidate,
  family: CombinedFamilyInfo,
  policy: FunctionAssignmentPolicy
): FunctionAssignmentCandidateType | null {
  const eligibility = policy.eligibility;
  const volunteerInfo =
    family.volunteerFamilyInfo?.individualVolunteers?.[candidate.personId];
  const userInfo = family.users?.find(
    (user) => user.personId === candidate.personId
  );

  if (eligibility?.eligiblePeople?.includes(candidate.personId)) {
    return 'Individuals';
  }

  if (
    containsAny(
      userInfo?.locationRoles,
      eligibility?.eligibleLocationRoles ?? []
    )
  ) {
    return 'Individuals';
  }

  if (
    eligibility?.eligibleIndividualVolunteerRoles?.some((role) =>
      isApprovedOrOnboarded(
        volunteerInfo?.approvalStatusByRole?.[role]?.currentStatus
      )
    )
  ) {
    return 'Individuals';
  }

  if (
    eligibility?.eligibleVolunteerFamilyRoles?.some((role) =>
      isApprovedOrOnboarded(
        family.volunteerFamilyInfo?.familyRoleApprovals?.[role]?.currentStatus
      )
    )
  ) {
    return 'Individuals';
  }

  return null;
}

function candidateTypeSortValue(candidateType: FunctionAssignmentCandidateType) {
  return ['Individuals', 'Families'].indexOf(candidateType);
}

function sortCandidates(
  candidates: FunctionAssignmentCandidate[]
): FunctionAssignmentCandidate[] {
  return candidates.sort(
    (a, b) =>
      candidateTypeSortValue(a.candidateType) -
        candidateTypeSortValue(b.candidateType) ||
      a.label.localeCompare(b.label)
  );
}

function sortCandidatesForAutocomplete(
  candidates: FunctionAssignmentCandidate[]
): FunctionAssignmentCandidate[] {
  return [...candidates].sort(
    (a, b) =>
      candidateTypeSortValue(a.candidateType) -
        candidateTypeSortValue(b.candidateType) ||
      a.label.localeCompare(b.label)
  );
}

function functionAssignmentCandidate(
  person: Person,
  family: CombinedFamilyInfo,
  familyId: string,
  policy: FunctionAssignmentPolicy
): FunctionAssignmentCandidate | null {
  const baseCandidate = {
    personId: person.id!,
    familyId,
    familyName: familyNameString(family),
    label: personNameString(person),
    candidateType: 'Individuals' as FunctionAssignmentCandidateType,
  };
  const candidateType = candidateTypeForPolicy(baseCandidate, family, policy);
  if (candidateType == null) return null;

  return {
    ...baseCandidate,
    candidateType,
  };
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildCandidatesByRole(
  families: CombinedFamilyInfo[],
  policies: FunctionAssignmentPolicy[]
) {
  const candidatesByRole = new Map<string, FunctionAssignmentCandidate[]>();

  for (const policy of policies) {
    const candidatesByPersonId = new Map<string, FunctionAssignmentCandidate>();

    for (const family of families) {
      for (const adult of family.family?.adults ?? []) {
        const person = adult.item1;
        const familyId = family.family?.id;
        if (!person?.id || !person.active || !familyId) continue;

        const candidate = functionAssignmentCandidate(
          person,
          family,
          familyId,
          policy
        );
        if (candidate == null) continue;

        candidatesByPersonId.set(candidate.personId, candidate);
      }
    }

    candidatesByRole.set(
      policy.assignmentRole,
      sortCandidates(Array.from(candidatesByPersonId.values()))
    );
  }

  return candidatesByRole;
}

function buildPeopleById(families: CombinedFamilyInfo[]) {
  const peopleById = new Map<string, PersonDirectoryEntry>();

  for (const family of families) {
    const familyId = family.family?.id;
    if (!familyId) continue;

    const familyName = familyNameString(family);
    for (const adult of family.family?.adults ?? []) {
      const person = adult.item1;
      if (person?.id) {
        peopleById.set(person.id, {
          person,
          familyId,
          familyName,
        });
      }
    }
  }

  return peopleById;
}

function sortAssignmentsByPersonName(
  assignments: AssignedIndividualVolunteer[],
  peopleById: Map<string, PersonDirectoryEntry>
) {
  return [...assignments].sort((a, b) =>
    personNameString(peopleById.get(a.personId)?.person).localeCompare(
      personNameString(peopleById.get(b.personId)?.person)
    )
  );
}

function buildDraftAssignments(
  assignments: AssignedIndividualVolunteer[],
  roles: string[],
  peopleById: Map<string, PersonDirectoryEntry>
) {
  return Object.fromEntries(
    roles.map((role) => [
      role,
      sortAssignmentsByPersonName(
        assignments.filter((assignment) => assignment.assignmentRole === role),
        peopleById
      )[0]?.personId ?? null,
    ])
  );
}

function assignmentCandidateForPerson(
  personId: string,
  peopleById: Map<string, PersonDirectoryEntry>
): FunctionAssignmentCandidate {
  const personEntry = peopleById.get(personId);

  return {
    personId,
    familyId: personEntry?.familyId,
    familyName: personEntry?.familyName ?? '',
    label: personNameString(personEntry?.person),
    candidateType: 'Individuals',
  };
}

export function FunctionAssignmentsSection({
  title = 'Function Assignments',
  assignments,
  policies,
  canEdit,
  onAssign,
  onUnassign,
}: FunctionAssignmentsSectionProps) {
  const families = useRecoilValue(visibleFamiliesQuery);
  const appNavigate = useAppNavigate();
  const withBackdrop = useBackdrop();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draftAssignments, setDraftAssignments] = useState<
    Record<string, string | null>
  >({});
  const [isSaving, setIsSaving] = useState(false);

  const policyRoles = useMemo(
    () =>
      uniqueValues(
        policies.map((policy) => policy.assignmentRole).filter(Boolean)
      ),
    [policies]
  );
  const roles = useMemo(() => {
    const configuredRoles = new Set(policyRoles);
    const unconfiguredAssignedRoles = uniqueValues(
      assignments
        .map((assignment) => assignment.assignmentRole)
        .filter((role) => role && !configuredRoles.has(role))
    ).sort((a, b) => a.localeCompare(b));

    return policyRoles.concat(unconfiguredAssignedRoles);
  }, [assignments, policyRoles]);

  const candidatesByRole = useMemo(
    () => buildCandidatesByRole(families, policies),
    [families, policies]
  );
  const peopleById = useMemo(() => buildPeopleById(families), [families]);

  function openDrawer() {
    setDraftAssignments(buildDraftAssignments(assignments, roles, peopleById));
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setDraftAssignments({});
  }

  function getOptionsForRole(assignmentRole: string) {
    const options = candidatesByRole.get(assignmentRole) ?? [];
    const selectedPersonId = draftAssignments[assignmentRole];
    if (
      !selectedPersonId ||
      options.some((option) => option.personId === selectedPersonId)
    ) {
      return sortCandidatesForAutocomplete(options);
    }

    return sortCandidatesForAutocomplete(
      options.concat(assignmentCandidateForPerson(selectedPersonId, peopleById))
    );
  }

  async function saveAssignments() {
    setIsSaving(true);
    try {
      await withBackdrop(async () => {
        for (const assignmentRole of roles) {
          const selectedPersonId = draftAssignments[assignmentRole] ?? null;
          const currentAssignments = assignments.filter(
            (assignment) => assignment.assignmentRole === assignmentRole
          );

          for (const assignment of currentAssignments) {
            if (assignment.personId === selectedPersonId) continue;

            await onUnassign(assignment.personId, assignmentRole);
          }

          const isAlreadyAssigned =
            selectedPersonId !== null &&
            currentAssignments.some(
              (assignment) => assignment.personId === selectedPersonId
            );

          if (selectedPersonId !== null && !isAlreadyAssigned) {
            await onAssign(selectedPersonId, assignmentRole);
          }
        }
      });
      closeDrawer();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Box className="ph-unmask" sx={{ width: '100%' }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
        <Typography variant="h3">{title}</Typography>
        {canEdit && (
          <Button variant="outlined" size="small" onClick={openDrawer}>
            Edit assignments
          </Button>
        )}
      </Stack>

      {roles.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No function assignment roles configured.
        </Typography>
      ) : (
        <Stack spacing={0.5}>
          {roles.map((assignmentRole) => {
            const assignedVolunteers = sortAssignmentsByPersonName(
              assignments.filter(
                (assignment) => assignment.assignmentRole === assignmentRole
              ),
              peopleById
            );

            return (
              <Typography key={assignmentRole}>
                <strong>{assignmentRole}:</strong>{' '}
                {assignedVolunteers.length === 0
                  ? '—'
                  : assignedVolunteers.map((assignment, index) => {
                      const personEntry = peopleById.get(assignment.personId);
                      const name = personNameString(personEntry?.person);

                      return (
                        <Fragment
                          key={`${assignment.assignmentRole}:${assignment.personId}`}
                        >
                          {index > 0 && ', '}
                          {personEntry ? (
                            <Button
                              variant="text"
                              sx={{
                                p: 0,
                                minWidth: 'auto',
                                textTransform: 'none',
                                fontSize: 'inherit',
                                fontWeight: 'inherit',
                                lineHeight: 'inherit',
                                verticalAlign: 'baseline',
                              }}
                              onClick={() =>
                                appNavigate.family(personEntry.familyId)
                              }
                            >
                              {name}
                            </Button>
                          ) : (
                            name
                          )}
                        </Fragment>
                      );
                    })}
              </Typography>
            );
          })}
        </Stack>
      )}

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={isSaving ? undefined : closeDrawer}
        PaperProps={{
          sx: {
            width: 500,
            p: 3,
            top: 45,
          },
        }}
      >
        <Stack spacing={2}>
          <Typography variant="h6">Edit Function Assignments</Typography>

          {roles.map((assignmentRole) => {
            const options = getOptionsForRole(assignmentRole);
            const selectedPersonId = draftAssignments[assignmentRole] ?? null;
            const selectedCandidate =
              options.find((option) => option.personId === selectedPersonId) ??
              null;

            return (
              <Box key={assignmentRole}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  {assignmentRole}
                </Typography>

                <Autocomplete
                  disablePortal
                  value={selectedCandidate}
                  options={options}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) =>
                    option.personId === value.personId
                  }
                  groupBy={(option) => option.candidateType}
                  disabled={isSaving}
                  noOptionsText="No eligible people available"
                  onChange={(_, candidate) => {
                    setDraftAssignments((current) => ({
                      ...current,
                      [assignmentRole]: candidate?.personId ?? null,
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      label={
                        options.length === 0
                          ? 'No eligible people available'
                          : 'Assigned person'
                      }
                    />
                  )}
                />
              </Box>
            );
          })}

          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button
              color="secondary"
              variant="contained"
              disabled={isSaving}
              onClick={closeDrawer}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={isSaving}
              onClick={() => {
                void saveAssignments();
              }}
            >
              Save
            </Button>
          </Stack>
        </Stack>
      </Drawer>
    </Box>
  );
}
