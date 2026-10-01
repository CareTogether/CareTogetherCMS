import {
  CombinedFamilyInfo,
  DateOnlyTimelineOfRoleApprovalStatus,
  RoleApprovalStatus,
} from '../../GeneratedClient';
import { filterOption } from './filterOption';

export type VolunteerApprovalRoleChipPresentation = {
  currentStatus?: RoleApprovalStatus;
  roleName: string;
  status?: DateOnlyTimelineOfRoleApprovalStatus;
};

export type VolunteerApprovalRolesPresentation = {
  familyRoles: VolunteerApprovalRoleChipPresentation[];
  individualRoles: VolunteerApprovalRoleChipPresentation[];
};

export function buildVolunteerApprovalRolesPresentation(
  family: CombinedFamilyInfo,
  roleFilters: Pick<filterOption, 'key'>[],
  personId?: string
): VolunteerApprovalRolesPresentation {
  const familyRoles = personId
    ? []
    : roleFilters.map((roleFilter) => ({
        currentStatus:
          family.volunteerFamilyInfo?.familyRoleApprovals?.[roleFilter.key]
            ?.currentStatus,
        roleName: roleFilter.key,
        status:
          family.volunteerFamilyInfo?.familyRoleApprovals?.[roleFilter.key]
            ?.effectiveRoleApprovalStatus,
      }));
  const individualRolesByName = new Map<
    string,
    VolunteerApprovalRoleChipPresentation
  >();

  const volunteers = family.volunteerFamilyInfo?.individualVolunteers ?? {};
  const individualVolunteers = personId
    ? volunteers[personId]
      ? [volunteers[personId]]
      : []
    : Object.values(volunteers);

  individualVolunteers.forEach(
    (volunteer) => {
      Object.entries(volunteer.approvalStatusByRole ?? {}).forEach(
        ([roleName, roleApprovalStatus]) => {
          if (
            roleApprovalStatus.currentStatus == null ||
            individualRolesByName.has(roleName)
          ) {
            return;
          }

          individualRolesByName.set(roleName, {
            currentStatus: roleApprovalStatus.currentStatus,
            roleName,
            status: roleApprovalStatus.effectiveRoleApprovalStatus,
          });
        }
      );
    }
  );

  return {
    familyRoles,
    individualRoles: Array.from(individualRolesByName.values()),
  };
}
