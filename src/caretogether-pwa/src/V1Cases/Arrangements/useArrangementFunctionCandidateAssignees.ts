import { useMemo } from 'react';
import {
  Arrangement,
  ArrangementFunction,
  CombinedFamilyInfo,
  Person,
  RoleApprovalStatus,
} from '../../GeneratedClient';
import { usePersonAndFamilyLookup } from '../../Model/DirectoryModel';
import { useVisibleFamilies } from '../../Model/Data';
import { getFamilyName } from './arrangementAssignmentPresentationHelpersV2';

type Family = NonNullable<CombinedFamilyInfo['family']>;

type Candidate = {
  family: Family;
  person: Person | null;
};

export type ArrangementFunctionCandidateAssignee = {
  candidateType: 'Families' | 'Individuals';
  displayName: string;
  familyId: string;
  key: string;
  personId: string | null;
};

type UseArrangementFunctionCandidateAssigneesParameters = {
  arrangement: Arrangement | null | undefined;
  arrangementFunction: ArrangementFunction | null | undefined;
  missingPrimaryContactFamilyName?: string;
};

function isApprovedOrOnboarded(status: RoleApprovalStatus | undefined) {
  return (
    status === RoleApprovalStatus.Approved ||
    status === RoleApprovalStatus.Onboarded
  );
}

function familyPrimaryContact(family: Family) {
  return family.adults!.find(
    (adult) => family.primaryFamilyContactPersonId === adult.item1!.id
  );
}

function compareCandidatesByName(first: Candidate, second: Candidate) {
  const firstPrimaryContact = familyPrimaryContact(first.family)?.item1;
  const secondPrimaryContact = familyPrimaryContact(second.family)?.item1;

  const firstFirstName = first.person ? first.person.firstName! : null;
  const firstLastName = first.person
    ? first.person.lastName!
    : (firstPrimaryContact?.lastName ?? '');
  const secondFirstName = second.person ? second.person.firstName! : null;
  const secondLastName = second.person
    ? second.person.lastName!
    : (secondPrimaryContact?.lastName ?? '');

  if (firstLastName < secondLastName) return -1;
  if (firstLastName > secondLastName) return 1;
  if (firstFirstName == null || secondFirstName == null) return 0;
  if (firstFirstName < secondFirstName) return -1;
  if (firstFirstName > secondFirstName) return 1;
  return 0;
}

function familyCandidateDisplayName(
  family: Family,
  missingPrimaryContactFamilyName: string
) {
  const primaryContact = familyPrimaryContact(family);
  return primaryContact ? getFamilyName(primaryContact) : missingPrimaryContactFamilyName;
}

export function useArrangementFunctionCandidateAssignees({
  arrangement,
  arrangementFunction,
  missingPrimaryContactFamilyName = 'Missing primary contact Family',
}: UseArrangementFunctionCandidateAssigneesParameters) {
  const visibleFamilies = useVisibleFamilies();
  const familyAndPersonLookup = usePersonAndFamilyLookup();

  return useMemo<ArrangementFunctionCandidateAssignee[]>(() => {
    if (!arrangement || !arrangementFunction) return [];

    const candidateNamedPeopleAssignees = arrangementFunction.eligiblePeople
      ? arrangementFunction.eligiblePeople
          .map((personId) => familyAndPersonLookup(personId))
          .filter(
            (personResult) =>
              personResult &&
              personResult.family &&
              !arrangement.individualVolunteerAssignments?.find(
                (assignment) =>
                  assignment.arrangementFunction ===
                    arrangementFunction.functionName &&
                  assignment.familyId === personResult.family!.id &&
                  assignment.personId === personResult.person?.id
              )
          )
          .map((personResult) => ({
            family: personResult.family!,
            person: personResult.person || null,
          }))
      : [];

    const candidateVolunteerIndividualAssignees =
      arrangementFunction.eligibleIndividualVolunteerRoles
        ? visibleFamilies.flatMap((family) =>
            family.volunteerFamilyInfo?.individualVolunteers
              ? Object.entries(family.volunteerFamilyInfo.individualVolunteers)
                  .filter(
                    ([volunteerId]) =>
                      family.family!.adults!.find(
                        (adult) => adult.item1!.id === volunteerId
                      )!.item1!.active
                  )
                  .flatMap(([volunteerId, volunteerInfo]) =>
                    volunteerInfo.approvalStatusByRole
                      ? Object.entries(
                          volunteerInfo.approvalStatusByRole
                        ).flatMap(([roleName, roleApprovalStatus]) =>
                          arrangementFunction.eligibleIndividualVolunteerRoles!.find(
                            (eligibleRole) => eligibleRole === roleName
                          ) &&
                          isApprovedOrOnboarded(
                            roleApprovalStatus.currentStatus
                          ) &&
                          !arrangement.individualVolunteerAssignments?.find(
                            (assignment) =>
                              assignment.arrangementFunction ===
                                arrangementFunction.functionName &&
                              assignment.familyId === family.family!.id &&
                              assignment.personId === volunteerId
                          )
                            ? [
                                {
                                  family: family.family!,
                                  person:
                                    family.family!.adults!.find(
                                      (adult) => adult.item1!.id === volunteerId
                                    )!.item1 || null,
                                },
                              ]
                            : []
                        )
                      : []
                  )
              : []
          )
        : [];

    const candidateVolunteerFamilyAssignees =
      arrangementFunction.eligibleVolunteerFamilyRoles
        ? visibleFamilies.flatMap((family) =>
            family.volunteerFamilyInfo?.familyRoleApprovals
              ? Object.entries(
                  family.volunteerFamilyInfo.familyRoleApprovals
                ).flatMap(([roleName, roleApprovalStatus]) =>
                  arrangementFunction.eligibleVolunteerFamilyRoles!.find(
                    (eligibleRole) => eligibleRole === roleName
                  ) &&
                  isApprovedOrOnboarded(roleApprovalStatus.currentStatus) &&
                  !arrangement.familyVolunteerAssignments?.find(
                    (assignment) =>
                      assignment.arrangementFunction ===
                        arrangementFunction.functionName &&
                      assignment.familyId === family.family!.id
                  )
                    ? [{ family: family.family!, person: null as Person | null }]
                    : []
                )
              : []
          )
        : [];

    const allCandidateAssignees = candidateNamedPeopleAssignees
      .concat(candidateVolunteerFamilyAssignees)
      .concat(candidateVolunteerIndividualAssignees);

    return allCandidateAssignees
      .filter((item, index) => allCandidateAssignees.indexOf(item) === index)
      .sort(compareCandidatesByName)
      .map((candidate) => {
        if (candidate.person == null) {
          return {
            familyId: candidate.family.id!,
            personId: null,
            key: candidate.family.id!,
            displayName: familyCandidateDisplayName(
              candidate.family,
              missingPrimaryContactFamilyName
            ),
            candidateType: 'Families',
          };
        }

        return {
          familyId: candidate.family.id!,
          personId: candidate.person.id!,
          key: `${candidate.family.id!}|${candidate.person.id || ''}`,
          displayName: `${candidate.person.firstName} ${candidate.person.lastName}`,
          candidateType: 'Individuals',
        };
      });
  }, [
    arrangement,
    arrangementFunction,
    familyAndPersonLookup,
    missingPrimaryContactFamilyName,
    visibleFamilies,
  ]);
}
