import {
  CombinedFamilyInfo,
  DateOnlyTimelineOfRoleApprovalStatus,
} from '../../GeneratedClient';
import { filterOption } from './filterOption';

export type VolunteerApprovalRoleChipPresentation = {
  roleName: string;
  status?: DateOnlyTimelineOfRoleApprovalStatus;
};

export type VolunteerApprovalRolesPresentation = {
  familyRoles: VolunteerApprovalRoleChipPresentation[];
  individualRoles: VolunteerApprovalRoleChipPresentation[];
};

export function buildVolunteerApprovalRolesPresentation(
  family: CombinedFamilyInfo,
  roleFilters: Pick<filterOption, 'key'>[]
): VolunteerApprovalRolesPresentation {
  const familyRoles = roleFilters.map((roleFilter) => ({
    roleName: roleFilter.key,
    status:
      family.volunteerFamilyInfo?.familyRoleApprovals?.[roleFilter.key]
        ?.effectiveRoleApprovalStatus,
  }));
  const individualRolesByName = new Map<
    string,
    VolunteerApprovalRoleChipPresentation
  >();

  family.family?.adults?.forEach((adult) => {
    const adultId = adult.item1?.id;

    if (!adultId) {
      return;
    }

    Object.entries(
      family.volunteerFamilyInfo?.individualVolunteers?.[adultId]
        ?.approvalStatusByRole ?? {}
    ).forEach(([roleName, roleApprovalStatus]) => {
      if (individualRolesByName.has(roleName)) {
        return;
      }

      individualRolesByName.set(roleName, {
        roleName,
        status: roleApprovalStatus.effectiveRoleApprovalStatus,
      });
    });
  });

  return {
    familyRoles,
    individualRoles: Array.from(individualRolesByName.values()),
  };
}
