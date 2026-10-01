import {
  CombinedFamilyInfo,
  DateOnlyTimelineOfRoleApprovalStatus,
  RoleApprovalStatus,
} from '../../GeneratedClient';
import { personNameString } from '../../Families/PersonName';
import { filterOption } from './filterOption';

export type VolunteerApprovalRoleChipPresentation = {
  currentStatus?: RoleApprovalStatus;
  personId?: string;
  personName?: string;
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
    : roleFilters.flatMap((roleFilter) => {
        const approval =
          family.volunteerFamilyInfo?.familyRoleApprovals?.[roleFilter.key];
        if (approval?.currentStatus == null) return [];

        return [
          {
            currentStatus: approval.currentStatus,
            roleName: roleFilter.key,
            status: approval.effectiveRoleApprovalStatus,
          },
        ];
      });
  const individualRoles: VolunteerApprovalRoleChipPresentation[] = [];
  const personNamesById = new Map(
    [
      ...(family.family?.adults ?? []).flatMap((adult) =>
        adult.item1?.id
          ? [[adult.item1.id, personNameString(adult.item1)] as const]
          : []
      ),
      ...(family.family?.children ?? []).flatMap((person) =>
        person?.id ? [[person.id, personNameString(person)] as const] : []
      ),
    ]
  );

  const volunteers = family.volunteerFamilyInfo?.individualVolunteers ?? {};
  const volunteersWithIds = personId
    ? [[personId, volunteers[personId]] as const].filter((entry) => !!entry[1])
    : Object.entries(volunteers);

  volunteersWithIds.forEach(([individualPersonId, volunteer]) => {
    Object.entries(volunteer.approvalStatusByRole ?? {}).forEach(
      ([roleName, roleApprovalStatus]) => {
        if (roleApprovalStatus.currentStatus == null) return;

        individualRoles.push({
          currentStatus: roleApprovalStatus.currentStatus,
          personId: individualPersonId,
          personName: personId
            ? undefined
            : personNamesById.get(individualPersonId),
          roleName,
          status: roleApprovalStatus.effectiveRoleApprovalStatus,
        });
      }
    );
  });

  return {
    familyRoles,
    individualRoles,
  };
}
