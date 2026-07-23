import { CombinedFamilyInfo } from '../../GeneratedClient';
import { personNameString } from '../../Families/PersonName';
import { notAppliedLabel } from './catchAllLabel';
import { filterOption } from './filterOption';
import { filterType } from './filterType';

export const missingRequirementFilterValue = '__missing__';
export const completeRequirementFilterValue = '__complete__';

export type RequirementFilterValue =
  | typeof completeRequirementFilterValue
  | typeof missingRequirementFilterValue
  | string;

export type VolunteerMissingRequirementGroup = {
  label: string;
  requirements: string[];
};

function selectedRoleFilters(roleFilters: filterOption[]) {
  return roleFilters.filter(
    (roleFilter) => roleFilter.selected && roleFilter.key !== notAppliedLabel
  );
}

function selectedFamilyRoleNames(roleFilters: filterOption[]) {
  return selectedRoleFilters(roleFilters)
    .filter((roleFilter) => roleFilter.type !== filterType.Individual)
    .map((roleFilter) => roleFilter.key);
}

function selectedIndividualRoleNames(roleFilters: filterOption[]) {
  return selectedRoleFilters(roleFilters)
    .filter((roleFilter) => roleFilter.type !== filterType.Family)
    .map((roleFilter) => roleFilter.key);
}

function requirementNames(
  missingRequirements:
    | NonNullable<
        CombinedFamilyInfo['volunteerFamilyInfo']
      >['missingRequirements']
    | undefined
) {
  return Array.from(
    new Set(
      (missingRequirements ?? [])
        .map((requirement) => requirement.item1)
        .filter((requirement): requirement is string => Boolean(requirement))
    )
  );
}

function shouldIncludeFamilyRequirements(
  family: CombinedFamilyInfo,
  familyRoleNames: string[],
  individualRoleNames: string[]
) {
  if (!familyRoleNames.length && !individualRoleNames.length) {
    return true;
  }

  return familyRoleNames.some(
    (roleName) =>
      family.volunteerFamilyInfo?.familyRoleApprovals?.[roleName] !== undefined
  );
}

function shouldIncludeIndividualRequirements(
  approvalStatusByRole:
    | NonNullable<
        NonNullable<
          CombinedFamilyInfo['volunteerFamilyInfo']
        >['individualVolunteers']
      >[string]['approvalStatusByRole']
    | undefined,
  familyRoleNames: string[],
  individualRoleNames: string[]
) {
  if (!familyRoleNames.length && !individualRoleNames.length) {
    return true;
  }

  return individualRoleNames.some(
    (roleName) => approvalStatusByRole?.[roleName] !== undefined
  );
}

export function buildVolunteerMissingRequirementGroups(
  family: CombinedFamilyInfo,
  roleFilters: filterOption[]
): VolunteerMissingRequirementGroup[] {
  const familyRoleNames = selectedFamilyRoleNames(roleFilters);
  const individualRoleNames = selectedIndividualRoleNames(roleFilters);
  const familyRequirements = shouldIncludeFamilyRequirements(
    family,
    familyRoleNames,
    individualRoleNames
  )
    ? requirementNames(family.volunteerFamilyInfo?.missingRequirements)
    : [];
  const familyGroups: VolunteerMissingRequirementGroup[] =
    familyRequirements.length > 0
      ? [{ label: 'Family', requirements: familyRequirements }]
      : [];
  const individualGroups = Object.entries(
    family.volunteerFamilyInfo?.individualVolunteers ?? {}
  ).flatMap(([personId, volunteer]) => {
    const requirements = shouldIncludeIndividualRequirements(
      volunteer.approvalStatusByRole,
      familyRoleNames,
      individualRoleNames
    )
      ? requirementNames(volunteer.missingRequirements)
      : [];

    if (!requirements.length) {
      return [];
    }

    const person = family.family?.adults?.find(
      (adult) => adult.item1?.id === personId
    )?.item1;

    return [
      {
        label: person ? personNameString(person) : 'Volunteer',
        requirements,
      },
    ];
  });

  return familyGroups.concat(individualGroups);
}

export function familyHasMissingRequirements(
  family: CombinedFamilyInfo,
  roleFilters: filterOption[],
  selectedRequirement: RequirementFilterValue | undefined
) {
  if (!selectedRequirement) {
    return true;
  }

  const groups = buildVolunteerMissingRequirementGroups(family, roleFilters);
  const hasMissingRequirements = groups.some(
    (group) => group.requirements.length > 0
  );

  if (selectedRequirement === missingRequirementFilterValue) {
    return hasMissingRequirements;
  }

  if (selectedRequirement === completeRequirementFilterValue) {
    return !hasMissingRequirements;
  }

  return groups.some((group) =>
    group.requirements.includes(selectedRequirement)
  );
}
