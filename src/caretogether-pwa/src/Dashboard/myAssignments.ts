import {
  ArrangementPhase,
  type CombinedFamilyInfo,
  type CommunityInfo,
} from '../GeneratedClient.ts';

export type CaseAssignment = {
  key: string;
  familyId: string;
  v1CaseId: string;
  role: string;
};

export type ArrangementAssignment = {
  key: string;
  familyId: string;
  v1CaseId: string;
  arrangementId: string;
  arrangementType: string;
  phase: ArrangementPhase;
  assignee: 'individual' | 'family';
  arrangementFunction: string;
  arrangementFunctionVariant?: string;
};

export type RoleAssignment = {
  key: string;
  communityId: string;
  communityName: string;
  role: string;
};

export type MyAssignments = {
  cases: CaseAssignment[];
  arrangements: ArrangementAssignment[];
  roles: RoleAssignment[];
};

const activePhases = new Set<ArrangementPhase>([
  ArrangementPhase.SettingUp,
  ArrangementPhase.ReadyToStart,
  ArrangementPhase.Started,
]);

function hasIdentity(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function unique<T extends { key: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter(({ key }) => !seen.has(key) && Boolean(seen.add(key)));
}

function compare(left: string, right: string) {
  return left === right ? 0 : left < right ? -1 : 1;
}

function ownFamilyId(
  personId: string,
  families: readonly CombinedFamilyInfo[]
) {
  const matches = new Set(
    families
      .filter(
        ({ family }) =>
          family?.active !== false &&
          hasIdentity(family?.id) &&
          family.adults?.some(
            (adult) =>
              adult?.item1?.id === personId && adult.item1.active !== false
          )
      )
      .map(({ family }) => family!.id!)
  );
  return matches.size === 1 ? [...matches][0] : undefined;
}

export function selectMyAssignments(
  personId: string | undefined,
  families: readonly CombinedFamilyInfo[],
  communities: readonly CommunityInfo[]
): MyAssignments {
  if (!hasIdentity(personId)) return { cases: [], arrangements: [], roles: [] };
  const familyId = ownFamilyId(personId, families);

  const cases: CaseAssignment[] = [];
  const arrangements: ArrangementAssignment[] = [];
  for (const { family, partneringFamilyInfo } of families) {
    const partneringFamilyId = family?.id;
    if (!hasIdentity(partneringFamilyId) || family?.active === false) continue;

    const openCase = partneringFamilyInfo?.openV1Case;
    if (openCase && hasIdentity(openCase.id) && !openCase.closedAtUtc) {
      for (const assigned of openCase.assignedIndividualVolunteers ?? []) {
        if (assigned?.personId !== personId) continue;
        if (!hasIdentity(assigned.assignmentRole)) continue;
        cases.push({
          key: JSON.stringify([
            'case',
            partneringFamilyId,
            openCase.id,
            assigned.assignmentRole,
          ]),
          familyId: partneringFamilyId,
          v1CaseId: openCase.id,
          role: assigned.assignmentRole,
        });
      }
    }

    const allCases = [
      ...(openCase ? [openCase] : []),
      ...(partneringFamilyInfo?.closedV1Cases ?? []),
    ];
    for (const v1Case of allCases) {
      if (!hasIdentity(v1Case?.id)) continue;
      for (const arrangement of v1Case.arrangements ?? []) {
        if (
          !hasIdentity(arrangement?.id) ||
          !activePhases.has(arrangement.phase)
        )
          continue;
        const target = {
          familyId: partneringFamilyId,
          v1CaseId: v1Case.id,
          arrangementId: arrangement.id,
          arrangementType: arrangement.arrangementType ?? '',
          phase: arrangement.phase,
        };
        const assignments = [
          ...(arrangement.individualVolunteerAssignments ?? [])
            .filter((assignment) => assignment?.personId === personId)
            .map((assignment) => ({
              assignee: 'individual' as const,
              volunteerFamilyId: assignment.familyId,
              arrangementFunction: assignment.arrangementFunction,
              arrangementFunctionVariant: assignment.arrangementFunctionVariant,
            })),
          ...(familyId
            ? (arrangement.familyVolunteerAssignments ?? [])
                .filter((assignment) => assignment?.familyId === familyId)
                .map((assignment) => ({
                  assignee: 'family' as const,
                  volunteerFamilyId: assignment.familyId,
                  arrangementFunction: assignment.arrangementFunction,
                  arrangementFunctionVariant:
                    assignment.arrangementFunctionVariant,
                }))
            : []),
        ];
        for (const assignment of assignments) {
          if (!hasIdentity(assignment.arrangementFunction)) continue;
          arrangements.push({
            ...target,
            key: JSON.stringify([
              'arrangement',
              partneringFamilyId,
              v1Case.id,
              arrangement.id,
              assignment.assignee,
              assignment.volunteerFamilyId ?? null,
              assignment.arrangementFunction,
              assignment.arrangementFunctionVariant ?? null,
            ]),
            assignee: assignment.assignee,
            arrangementFunction: assignment.arrangementFunction,
            arrangementFunctionVariant:
              assignment.arrangementFunctionVariant ?? undefined,
          });
        }
      }
    }
  }

  const roles = communities.flatMap(({ community }) =>
    hasIdentity(community?.id)
      ? (community.communityRoleAssignments ?? [])
          .filter(
            (assignment) =>
              assignment?.personId === personId &&
              hasIdentity(assignment.communityRole)
          )
          .map((assignment) => ({
            key: JSON.stringify([
              'role',
              community.id,
              assignment.communityRole,
            ]),
            communityId: community.id,
            communityName: community.name ?? '',
            role: assignment.communityRole,
          }))
      : []
  );

  return {
    cases: unique(cases).sort((left, right) => compare(left.key, right.key)),
    arrangements: unique(arrangements).sort((left, right) =>
      compare(left.key, right.key)
    ),
    roles: unique(roles).sort(
      (left, right) =>
        compare(left.communityName, right.communityName) ||
        compare(left.key, right.key)
    ),
  };
}
