import {
  Permission,
  RoleApprovalStatus,
  type CombinedFamilyInfo,
  type CommunityInfo,
  type DateOnlyTimelineOfRoleApprovalStatus,
} from '../GeneratedClient.ts';
import type { FamilyNavigationOptions } from '../Hooks/useAppNavigate';
import type { LocationScope } from '../Model/LocationScope';

type ApprovalSubject =
  | { kind: 'family'; familyId: string }
  | ({ kind: 'individual'; familyId: string } & Required<
      Pick<FamilyNavigationOptions, 'familyMemberId'>
    >)
  | { kind: 'organization'; communityId: string };

type EffectiveStatus =
  | RoleApprovalStatus.Approved
  | RoleApprovalStatus.Onboarded;

export type ApprovalExpirationWorkItem = {
  id: string;
  scope: LocationScope;
  target: ApprovalSubject;
  roleName: string;
  expirationDate: string;
  status: 'expiring' | 'expired';
  previousStatus: EffectiveStatus;
};

type EffectiveRole = {
  effectiveRoleApprovalStatus?: DateOnlyTimelineOfRoleApprovalStatus;
};

const millisecondsPerDay = 86_400_000;
const firstDateOnly = Date.parse('0001-01-01');
const lastDateOnly = Date.parse('9999-12-31');

function hasIdentity(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function dateOnlyTimestamp(date: unknown) {
  if (!(date instanceof Date)) return NaN;
  const timestamp = date.getTime();
  return timestamp >= firstDateOnly &&
    timestamp <= lastDateOnly &&
    timestamp % millisecondsPerDay === 0
    ? timestamp
    : NaN;
}

function isEffective(status: RoleApprovalStatus): status is EffectiveStatus {
  return (
    status === RoleApprovalStatus.Approved ||
    status === RoleApprovalStatus.Onboarded
  );
}

function effectiveExpiration(
  timeline: DateOnlyTimelineOfRoleApprovalStatus | undefined,
  today: number
):
  | Pick<
      ApprovalExpirationWorkItem,
      'expirationDate' | 'previousStatus' | 'status'
    >
  | undefined {
  if (!Array.isArray(timeline?.ranges)) return;

  const ranges = timeline.ranges.map((range) => ({
    start: dateOnlyTimestamp(range?.start),
    end: dateOnlyTimestamp(range?.end),
    tag: range?.tag,
  }));
  if (
    ranges.some(
      ({ start, end, tag }) =>
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        start > end ||
        typeof tag !== 'number' ||
        RoleApprovalStatus[tag] === undefined
    )
  )
    return;

  ranges.sort((left, right) => left.start - right.start);
  if (
    ranges.some(
      ({ start }, index) => index > 0 && ranges[index - 1].end >= start
    )
  )
    return;

  const currentIndex = ranges.findIndex(
    ({ start, end }) => start <= today && today <= end
  );
  const current = ranges[currentIndex];
  if (!current) return;
  if (current.tag === RoleApprovalStatus.Expired) {
    let start = current.start;
    let previousIndex = currentIndex - 1;
    while (
      ranges[previousIndex]?.tag === RoleApprovalStatus.Expired &&
      ranges[previousIndex].end + millisecondsPerDay === start
    ) {
      start = ranges[previousIndex].start;
      previousIndex--;
    }
    const previous = ranges[previousIndex];
    if (
      !previous ||
      !isEffective(previous.tag) ||
      previous.end + millisecondsPerDay !== start
    )
      return;
    return {
      status: 'expired',
      expirationDate: new Date(start).toISOString().slice(0, 10),
      previousStatus: previous.tag,
    };
  }
  if (!isEffective(current.tag)) return;

  let previousStatus = current.tag;
  let lastCoveredDay = current.end;
  for (const next of ranges.slice(currentIndex + 1)) {
    if (next.start !== lastCoveredDay + millisecondsPerDay) return;
    if (next.tag === RoleApprovalStatus.Expired) {
      return {
        status: 'expiring',
        expirationDate: new Date(next.start).toISOString().slice(0, 10),
        previousStatus,
      };
    }
    if (!isEffective(next.tag)) return;
    previousStatus = next.tag;
    lastCoveredDay = next.end;
  }
}

export function buildApprovalExpirationWorkQueue(
  scope: LocationScope,
  families: readonly CombinedFamilyInfo[],
  communities: readonly CommunityInfo[],
  evaluationTime: Date
): ApprovalExpirationWorkItem[] {
  const today =
    Math.floor(evaluationTime.getTime() / millisecondsPerDay) *
    millisecondsPerDay;
  if (
    !hasIdentity(scope.organizationId) ||
    !hasIdentity(scope.locationId) ||
    !Number.isFinite(today)
  ) {
    return [];
  }

  const items: ApprovalExpirationWorkItem[] = [];
  function addRoles(
    target: ApprovalSubject,
    roles?: Record<string, EffectiveRole>
  ) {
    for (const [roleName, role] of Object.entries(roles ?? {})) {
      if (!hasIdentity(roleName)) continue;
      const expiration = effectiveExpiration(
        role?.effectiveRoleApprovalStatus,
        today
      );
      if (!expiration) continue;

      const subjectIds =
        target.kind === 'organization'
          ? [target.communityId]
          : [
              target.familyId,
              target.kind === 'individual' ? target.familyMemberId : null,
            ];
      const id = JSON.stringify([
        'effective-approval-expiration',
        1,
        scope.organizationId,
        scope.locationId,
        target.kind,
        ...subjectIds,
        roleName,
      ]);
      items.push({ id, scope, target, roleName, ...expiration });
    }
  }

  for (const family of families) {
    const familyId = family?.family?.id;
    const approval = family?.volunteerFamilyInfo;
    if (
      !hasIdentity(familyId) ||
      !family.userPermissions?.includes(Permission.ViewApprovalStatus) ||
      !approval
    )
      continue;

    addRoles({ kind: 'family', familyId }, approval.familyRoleApprovals);
    for (const [familyMemberId, individual] of Object.entries(
      approval.individualVolunteers ?? {}
    )) {
      if (!hasIdentity(familyMemberId)) continue;
      addRoles(
        { kind: 'individual', familyId, familyMemberId },
        individual?.approvalStatusByRole
      );
    }
  }

  for (const community of communities) {
    const communityId = community?.community?.id;
    if (
      !hasIdentity(communityId) ||
      !community.userPermissions?.includes(Permission.ViewApprovalStatus)
    )
      continue;
    addRoles(
      { kind: 'organization', communityId },
      community.approvalInfo?.approvalStatusByRole
    );
  }

  return items.sort(
    (left, right) =>
      left.expirationDate.localeCompare(right.expirationDate) ||
      (left.id === right.id ? 0 : left.id < right.id ? -1 : 1)
  );
}
