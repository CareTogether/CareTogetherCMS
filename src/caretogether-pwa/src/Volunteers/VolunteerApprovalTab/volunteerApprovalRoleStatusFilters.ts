import { CombinedFamilyInfo, VolunteerInfo } from '../../GeneratedClient';
import { checkStatusEquivalence } from './checkStatusEquivalence';
import { notAppliedLabel } from './catchAllLabel';
import { filterOption } from './filterOption';
import { filterType } from './filterType';

function selectedFamilyRoleKeys(roleFilters: filterOption[]) {
  return roleFilters
    .filter(
      (filterOption) =>
        filterOption.selected && filterOption.type !== filterType.Individual
    )
    .map((filterOption) => filterOption.key);
}

function selectedIndividualRoleKeys(roleFilters: filterOption[]) {
  return roleFilters
    .filter(
      (filterOption) =>
        filterOption.selected && filterOption.type !== filterType.Family
    )
    .map((filterOption) => filterOption.key);
}

function selectedStatusKeys(statusFilters: filterOption[]) {
  return statusFilters
    .filter((filterOption) => filterOption.selected)
    .map((filterOption) => filterOption.value);
}

function getFamilyMembers(family: CombinedFamilyInfo) {
  return (
    (family.volunteerFamilyInfo?.individualVolunteers &&
      Object.entries(family.volunteerFamilyInfo?.individualVolunteers)) ||
    []
  );
}

function familyHasNotAppliedForAnyRoles(family: CombinedFamilyInfo) {
  const familyRoleApprovals =
    family.volunteerFamilyInfo?.familyRoleApprovals ?? {};

  const familyHasAppliedRole = Object.values(familyRoleApprovals).some(
    (roleApproval) => roleApproval.currentStatus != null
  );

  if (familyHasAppliedRole) {
    return false;
  }

  return getFamilyMembers(family).every(([, volunteer]) => {
    const individualRoleApprovals = volunteer.approvalStatusByRole ?? {};
    return Object.values(individualRoleApprovals).every(
      (roleApproval) => roleApproval.currentStatus == null
    );
  });
}

function familyHasNoValidStatuses(
  family: CombinedFamilyInfo,
  roleFilters: filterOption[]
) {
  return roleFilters
    .filter((filterOption) => filterOption.key !== notAppliedLabel)
    .every(
      (filterOption) =>
        family.volunteerFamilyInfo?.familyRoleApprovals?.[filterOption.key] ===
        undefined
    );
}

function familyHasSpecificRoleInValidStatus(
  family: CombinedFamilyInfo,
  roleName: string,
  statusFilters: filterOption[]
) {
  return statusFilters
    .filter((filterOption) => filterOption.key !== notAppliedLabel)
    .some((status) =>
      checkStatusEquivalence(
        status.value,
        family.volunteerFamilyInfo?.familyRoleApprovals?.[roleName]
          ?.currentStatus
      )
    );
}

function familyMeetsFilterCriteria(
  family: CombinedFamilyInfo,
  roleFilters: filterOption[],
  statusFilters: filterOption[]
) {
  const familyRoleKeys = selectedFamilyRoleKeys(roleFilters);
  const individualRoleKeys = selectedIndividualRoleKeys(roleFilters);
  const statusKeys = selectedStatusKeys(statusFilters);

  if (!familyRoleKeys.length) {
    if (!statusKeys.length) {
      return individualRoleKeys.length === 0;
    }
    return statusKeys.some((status) =>
      status === notAppliedLabel
        ? familyHasNoValidStatuses(family, roleFilters)
        : roleFilters.some((roleFilter) =>
            checkStatusEquivalence(
              status,
              family.volunteerFamilyInfo?.familyRoleApprovals?.[roleFilter.key]
                ?.currentStatus
            )
          )
    );
  }
  return familyRoleKeys.some((roleName) => {
    if (roleName === notAppliedLabel) {
      return familyHasNotAppliedForAnyRoles(family);
    }

    const familyHasRole =
      family.volunteerFamilyInfo?.familyRoleApprovals?.[roleName] !==
      undefined;
    if (!familyHasRole) {
      return familyHasRole;
    }
    if (statusKeys.length === 0) {
      return familyHasSpecificRoleInValidStatus(
        family,
        roleName,
        statusFilters
      );
    }
    return statusKeys.some((status) =>
      checkStatusEquivalence(
        status,
        family.volunteerFamilyInfo?.familyRoleApprovals?.[roleName]
          ?.currentStatus
      )
    );
  });
}

function familyMemberHasNoValidStatuses(
  volunteer: VolunteerInfo,
  roleFilters: filterOption[]
) {
  return roleFilters
    .filter((filterOption) => filterOption.key !== notAppliedLabel)
    .every((filterOption) =>
      checkStatusEquivalence(
        volunteer.approvalStatusByRole?.[filterOption.key]?.currentStatus,
        null
      )
    );
}

function familyMemberHasSpecificRoleInValidStatus(
  volunteer: VolunteerInfo,
  roleName: string,
  statusFilters: filterOption[]
) {
  return statusFilters
    .filter((filterOption) => filterOption.key !== notAppliedLabel)
    .some((status) =>
      checkStatusEquivalence(
        status.value,
        volunteer.approvalStatusByRole?.[roleName]?.currentStatus
      )
    );
}

function familyMemberHasARoleInSelectedStatus(
  volunteer: VolunteerInfo,
  status: string,
  roleFilters: filterOption[]
) {
  return status === notAppliedLabel
    ? familyMemberHasNoValidStatuses(volunteer, roleFilters)
    : roleFilters.some((roleFilter) =>
        checkStatusEquivalence(
          volunteer.approvalStatusByRole?.[roleFilter.key]?.currentStatus,
          status
        )
      );
}

function familyMembersMeetFilterCriteria(
  family: CombinedFamilyInfo,
  roleFilters: filterOption[],
  statusFilters: filterOption[]
) {
  const familyMembers = getFamilyMembers(family);
  const familyRoleKeys = selectedFamilyRoleKeys(roleFilters);
  const individualRoleKeys = selectedIndividualRoleKeys(roleFilters);
  const statusKeys = selectedStatusKeys(statusFilters);

  if (!individualRoleKeys.length) {
    if (!statusKeys.length) {
      return !familyRoleKeys.length;
    }
    return statusKeys.some(
      (status) =>
        familyMembers.filter(([, volunteer]) =>
          familyMemberHasARoleInSelectedStatus(
            volunteer,
            status ? status : notAppliedLabel,
            roleFilters
          )
        ).length > 0
    );
  }
  return individualRoleKeys.some((roleName) => {
    if (roleName === notAppliedLabel) {
      return familyHasNotAppliedForAnyRoles(family);
    }

    return familyMembers.some(([, volunteer]) => {
      if (!statusKeys.length) {
        return familyMemberHasSpecificRoleInValidStatus(
          volunteer,
          roleName,
          statusFilters
        );
      }
      return statusKeys.some((status) =>
        checkStatusEquivalence(
          status,
          volunteer.approvalStatusByRole?.[roleName]?.currentStatus
        )
      );
    });
  });
}

export function familyOrFamilyMembersMeetRoleStatusFilterCriteria(
  family: CombinedFamilyInfo,
  roleFilters: filterOption[],
  statusFilters: filterOption[]
) {
  const familyMeetsRoleCriteria = familyMeetsFilterCriteria(
    family,
    roleFilters,
    statusFilters
  );
  const familyMembersMeetRoleCriteria = familyMembersMeetFilterCriteria(
    family,
    roleFilters,
    statusFilters
  );
  const familyRolesSelected = selectedFamilyRoleKeys(roleFilters).length > 0;
  const individualRolesSelected =
    selectedIndividualRoleKeys(roleFilters).length > 0;
  const statusesSelected = selectedStatusKeys(statusFilters).length > 0;
  let result = true;
  if (familyRolesSelected && individualRolesSelected) {
    result = familyMeetsRoleCriteria || familyMembersMeetRoleCriteria;
  } else if (familyRolesSelected) {
    result = familyMeetsRoleCriteria;
  } else if (individualRolesSelected) {
    result = familyMembersMeetRoleCriteria;
  } else if (statusesSelected) {
    result = familyMeetsRoleCriteria || familyMembersMeetRoleCriteria;
  }
  return result;
}
