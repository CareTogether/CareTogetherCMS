import {
  CombinedFamilyInfo,
  DateOnlyTimelineOfRoleApprovalStatus,
  RoleApprovalStatus,
  RoleRemovalReason,
  type RoleRemoval,
} from '../../GeneratedClient';
import { personNameString } from '../../Families/PersonName';
import { filterOption } from './filterOption';
import { isRoleApprovalStatusVisibleInSummary } from '../roleApprovalStatusPresentation';

export type VolunteerApprovalRoleChipPresentation = {
  currentStatus?: RoleApprovalStatus;
  personId?: string;
  personName?: string;
  roleName: string;
  statusLabel?: string;
  status?: DateOnlyTimelineOfRoleApprovalStatus;
};

export type VolunteerApprovalRolesPresentation = {
  familyRoles: VolunteerApprovalRoleChipPresentation[];
  individualRoles: VolunteerApprovalRoleChipPresentation[];
};

function activeOptOutRemovals(roleRemovals: RoleRemoval[] | undefined) {
  const now = new Date();
  return (roleRemovals ?? []).filter(
    (removal) =>
      removal.reason === RoleRemovalReason.OptOut &&
      (!removal.effectiveUntil || removal.effectiveUntil > now)
  );
}

function normalizedRoleName(roleName: string) {
  return roleName.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function matchingOptOutRemoval(
  roleRemovals: RoleRemoval[] | undefined,
  roleName: string
) {
  return activeOptOutRemovals(roleRemovals).find(
    (removal) =>
      normalizedRoleName(removal.roleName) === normalizedRoleName(roleName)
  );
}

export function buildVolunteerApprovalRolesPresentation(
  family: CombinedFamilyInfo,
  roleFilters: Pick<filterOption, 'key'>[],
  personId?: string
): VolunteerApprovalRolesPresentation {
  const familyRoles: VolunteerApprovalRoleChipPresentation[] = personId
    ? []
    : roleFilters.flatMap((roleFilter) => {
        const approval =
          family.volunteerFamilyInfo?.familyRoleApprovals?.[roleFilter.key];
        if (
          approval?.currentStatus == null ||
          !isRoleApprovalStatusVisibleInSummary(approval.currentStatus)
        ) {
          return [];
        }

        return [
          {
            currentStatus: approval.currentStatus,
            roleName: roleFilter.key,
            statusLabel: matchingOptOutRemoval(
              family.volunteerFamilyInfo?.roleRemovals,
              roleFilter.key
            )
              ? `Opted out ${roleFilter.key}`
              : undefined,
            status: approval.effectiveRoleApprovalStatus,
          },
        ];
      });
  const familyOptOuts = personId
    ? []
    : activeOptOutRemovals(family.volunteerFamilyInfo?.roleRemovals);
  familyOptOuts.forEach((removal) => {
    if (
      familyRoles.some(
        (role) =>
          normalizedRoleName(role.roleName) ===
          normalizedRoleName(removal.roleName)
      )
    ) {
      return;
    }

    familyRoles.push({
      currentStatus: RoleApprovalStatus.Inactive,
      roleName: removal.roleName,
      statusLabel: `Opted out ${removal.roleName}`,
      status: undefined,
    });
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
        if (
          roleApprovalStatus.currentStatus == null ||
          !isRoleApprovalStatusVisibleInSummary(
            roleApprovalStatus.currentStatus
          )
        ) {
          return;
        }

        individualRoles.push({
          currentStatus: roleApprovalStatus.currentStatus,
          personId: individualPersonId,
          personName: personId
            ? undefined
            : personNamesById.get(individualPersonId),
          roleName,
          statusLabel: matchingOptOutRemoval(volunteer.roleRemovals, roleName)
            ? `Opted out ${roleName}`
            : undefined,
          status: roleApprovalStatus.effectiveRoleApprovalStatus,
        });
      }
    );
    activeOptOutRemovals(volunteer.roleRemovals).forEach((removal) => {
      if (
        individualRoles.some(
          (role) =>
            role.personId === individualPersonId &&
            normalizedRoleName(role.roleName) ===
              normalizedRoleName(removal.roleName)
        )
      ) {
        return;
      }

      individualRoles.push({
        currentStatus: RoleApprovalStatus.Inactive,
        personId: individualPersonId,
        personName: personId
          ? undefined
          : personNamesById.get(individualPersonId),
        roleName: removal.roleName,
        statusLabel: `Opted out ${removal.roleName}`,
      });
    });
  });

  return {
    familyRoles,
    individualRoles,
  };
}
