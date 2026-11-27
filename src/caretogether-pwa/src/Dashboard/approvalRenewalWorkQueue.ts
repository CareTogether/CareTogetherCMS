import {
  ApprovalRenewalRoleScope,
  DisclosedApprovalRenewalState,
  FamilyApprovalRenewalTarget,
  IndividualApprovalRenewalTarget,
  OrganizationApprovalRenewalTarget,
  type CombinedFamilyInfo,
  type CommunityInfo,
  type DisclosedApprovalRenewalCandidate,
  type DisclosedApprovalRenewalRole,
} from '../GeneratedClient.ts';
import type { LocationScope } from '../Model/LocationScope';
import type { ApprovalExpirationWorkItem } from './approvalExpirationWorkQueue';

type RenewalTarget = ApprovalExpirationWorkItem['target'];

export type ApprovalRenewalWorkItem = Pick<
  DisclosedApprovalRenewalCandidate,
  'candidateKey' | 'actionName' | 'state'
> & {
  snoozeToken?: string;
  scope: LocationScope;
  target: RenewalTarget;
  firstUncoveredOnUtc: string;
  affectedRoles: readonly DisclosedApprovalRenewalRole[];
};

function hasIdentity(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function familyTarget(
  target: DisclosedApprovalRenewalCandidate['target'],
  familyId: string
): RenewalTarget | undefined {
  if (
    target instanceof FamilyApprovalRenewalTarget &&
    target.familyId === familyId
  ) {
    return { kind: 'family', familyId };
  }
  if (
    target instanceof IndividualApprovalRenewalTarget &&
    target.familyId === familyId &&
    hasIdentity(target.personId)
  ) {
    return { kind: 'individual', familyId, familyMemberId: target.personId };
  }
}

function organizationTarget(
  target: DisclosedApprovalRenewalCandidate['target'],
  communityId: string
): RenewalTarget | undefined {
  if (
    target instanceof OrganizationApprovalRenewalTarget &&
    target.communityId === communityId
  ) {
    return { kind: 'organization', communityId };
  }
}

function normalize(
  scope: LocationScope,
  candidate: DisclosedApprovalRenewalCandidate,
  target: RenewalTarget | undefined
): ApprovalRenewalWorkItem[] {
  const {
    candidateKey,
    actionName,
    firstUncoveredOnUtc,
    state,
    affectedRoles,
  } = candidate;
  if (
    !target ||
    !hasIdentity(candidateKey) ||
    !hasIdentity(actionName) ||
    !(firstUncoveredOnUtc instanceof Date) ||
    !Number.isFinite(firstUncoveredOnUtc.getTime()) ||
    (state !== DisclosedApprovalRenewalState.Upcoming &&
      state !== DisclosedApprovalRenewalState.Uncovered) ||
    !Array.isArray(affectedRoles) ||
    affectedRoles.some(
      (role) =>
        !hasIdentity(role?.roleName) ||
        (role.scope !== ApprovalRenewalRoleScope.Family &&
          role.scope !== ApprovalRenewalRoleScope.Individual &&
          role.scope !== ApprovalRenewalRoleScope.Organization)
    )
  )
    return [];

  const isoDate = firstUncoveredOnUtc.toISOString();
  if (!/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/.test(isoDate)) return [];

  return [
    {
      candidateKey,
      actionName,
      firstUncoveredOnUtc: isoDate.slice(0, 10),
      state,
      affectedRoles,
      scope,
      target,
      snoozeToken: JSON.stringify([
        'approval-renewal',
        candidateKey,
        isoDate.slice(0, 10),
      ]),
    },
  ];
}

export function buildApprovalRenewalWorkQueue(
  scope: LocationScope,
  families: readonly CombinedFamilyInfo[],
  communities: readonly CommunityInfo[]
): ApprovalRenewalWorkItem[] {
  if (!hasIdentity(scope.organizationId) || !hasIdentity(scope.locationId))
    return [];

  const familyItems = families.flatMap((record) => {
    const familyId = record.family?.id;
    if (!hasIdentity(familyId)) return [];
    return (record.volunteerFamilyInfo?.renewalCandidates ?? []).flatMap(
      (candidate) =>
        normalize(scope, candidate, familyTarget(candidate.target, familyId))
    );
  });
  const organizationItems = communities.flatMap((record) => {
    const communityId = record.community?.id;
    if (!hasIdentity(communityId)) return [];
    return (record.approvalInfo?.renewalCandidates ?? []).flatMap((candidate) =>
      normalize(
        scope,
        candidate,
        organizationTarget(candidate.target, communityId)
      )
    );
  });

  return [...familyItems, ...organizationItems].sort(
    (left, right) =>
      left.firstUncoveredOnUtc.localeCompare(right.firstUncoveredOnUtc) ||
      (left.candidateKey === right.candidateKey
        ? 0
        : left.candidateKey < right.candidateKey
          ? -1
          : 1)
  );
}
