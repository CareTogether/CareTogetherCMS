import {
  AssignedIndividualVolunteer,
  CombinedFamilyInfo,
  FunctionAssignmentPolicy,
  Person,
  RoleApprovalStatus,
} from '../GeneratedClient';
import { familyNameString } from '../Families/FamilyName';
import { personNameString } from '../Families/PersonName';

export type FunctionAssignmentCandidateType = 'Individuals' | 'Families';

export type FunctionAssignmentCandidate = {
  personId: string;
  familyId?: string;
  familyName: string;
  label: string;
  candidateType: FunctionAssignmentCandidateType;
};

export type PersonDirectoryEntry = {
  person: Person;
  familyId: string;
  familyName: string;
};

export type FunctionAssignmentChange =
  | {
      assignmentRole: string;
      kind: 'unassign';
      personId: string;
    }
  | {
      assignmentRole: string;
      kind: 'assign';
      personId: string;
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

export function sortCandidatesForAutocomplete(
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

export function buildCandidatesByRole(
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

export function buildPeopleById(families: CombinedFamilyInfo[]) {
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

export function sortAssignmentsByPersonName(
  assignments: AssignedIndividualVolunteer[],
  peopleById: Map<string, PersonDirectoryEntry>
) {
  return [...assignments].sort((a, b) =>
    personNameString(peopleById.get(a.personId)?.person).localeCompare(
      personNameString(peopleById.get(b.personId)?.person)
    )
  );
}

export function buildDraftAssignments(
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

export function assignmentCandidateForPerson(
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

export function functionAssignmentRoles(
  assignments: AssignedIndividualVolunteer[],
  policies: FunctionAssignmentPolicy[]
) {
  const policyRoles = uniqueValues(
    policies.map((policy) => policy.assignmentRole).filter(Boolean)
  );
  const configuredRoles = new Set(policyRoles);
  const unconfiguredAssignedRoles = uniqueValues(
    assignments
      .map((assignment) => assignment.assignmentRole)
      .filter((role) => role && !configuredRoles.has(role))
  ).sort((a, b) => a.localeCompare(b));

  return policyRoles.concat(unconfiguredAssignedRoles);
}

export function functionAssignmentChanges(
  assignments: AssignedIndividualVolunteer[],
  roles: string[],
  draftAssignments: Record<string, string | null>
): FunctionAssignmentChange[] {
  return roles.flatMap((assignmentRole) => {
    const selectedPersonId = draftAssignments[assignmentRole] ?? null;
    const currentAssignments = assignments.filter(
      (assignment) => assignment.assignmentRole === assignmentRole
    );
    const unassignments = currentAssignments
      .filter((assignment) => assignment.personId !== selectedPersonId)
      .map(
        (assignment): FunctionAssignmentChange => ({
          assignmentRole,
          kind: 'unassign',
          personId: assignment.personId,
        })
      );
    const isAlreadyAssigned =
      selectedPersonId !== null &&
      currentAssignments.some(
        (assignment) => assignment.personId === selectedPersonId
      );

    if (selectedPersonId === null || isAlreadyAssigned) {
      return unassignments;
    }

    return unassignments.concat({
      assignmentRole,
      kind: 'assign',
      personId: selectedPersonId,
    });
  });
}
