import type {
  CombinedFamilyInfo,
  MissingArrangementRequirement,
} from '../GeneratedClient';
import type { FamilyNavigationOptions } from '../Hooks/useAppNavigate';
import type { LocationScope } from '../Model/LocationScope';

type ArrangementWorkQueueTarget = {
  familyId: string;
} & Required<Pick<FamilyNavigationOptions, 'v1CaseId' | 'arrangementId'>>;

type ArrangementRequirementAssignment = Required<
  Pick<
    MissingArrangementRequirement,
    'arrangementFunction' | 'volunteerFamilyId'
  >
> &
  Pick<
    MissingArrangementRequirement,
    'arrangementFunctionVariant' | 'personId'
  >;

export type ArrangementWorkQueueItem = {
  id: string;
  requirementName: string;
  target: ArrangementWorkQueueTarget;
  assignment?: ArrangementRequirementAssignment;
  occurrenceDate: string;
  status: 'upcoming' | 'past-due';
  snoozeToken?: string;
};

function hasIdentity(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function readAssignment(requirement: MissingArrangementRequirement) {
  const {
    arrangementFunction,
    arrangementFunctionVariant,
    volunteerFamilyId,
    personId,
  } = requirement;

  if (
    arrangementFunction == null &&
    arrangementFunctionVariant == null &&
    volunteerFamilyId == null &&
    personId == null
  ) {
    return undefined;
  }

  if (
    !hasIdentity(arrangementFunction) ||
    !hasIdentity(volunteerFamilyId) ||
    (arrangementFunctionVariant != null &&
      !hasIdentity(arrangementFunctionVariant)) ||
    (personId != null && !hasIdentity(personId))
  ) {
    return null;
  }

  return {
    arrangementFunction,
    arrangementFunctionVariant: arrangementFunctionVariant ?? undefined,
    volunteerFamilyId,
    personId: personId ?? undefined,
  };
}

function projectRequirement(
  scope: LocationScope,
  target: ArrangementWorkQueueTarget,
  requirement: MissingArrangementRequirement
): ArrangementWorkQueueItem[] {
  const { action, dueBy, pastDueSince } = requirement;
  if (
    action?.isRequired !== true ||
    !hasIdentity(action.actionName) ||
    (dueBy != null && pastDueSince != null)
  ) {
    return [];
  }

  const date = dueBy ?? pastDueSince;
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return [];

  const isoDate = date.toISOString();
  if (!/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/.test(isoDate)) return [];
  const occurrenceDate = isoDate.slice(0, 10);

  const assignment = readAssignment(requirement);
  if (assignment === null) return [];

  const id = JSON.stringify([
    'arrangement-requirement',
    1,
    scope.organizationId,
    scope.locationId,
    target.familyId,
    target.v1CaseId,
    target.arrangementId,
    action.actionName,
    assignment?.arrangementFunction ?? null,
    assignment?.arrangementFunctionVariant ?? null,
    assignment?.volunteerFamilyId ?? null,
    assignment?.personId ?? null,
    occurrenceDate,
  ]);

  return [
    {
      id,
      requirementName: action.actionName,
      target,
      assignment,
      occurrenceDate,
      status: dueBy == null ? 'past-due' : 'upcoming',
      snoozeToken: id,
    },
  ];
}

function compareText(left: string, right: string) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function buildArrangementWorkQueue(
  scope: LocationScope,
  families: readonly CombinedFamilyInfo[]
): ArrangementWorkQueueItem[] {
  if (!hasIdentity(scope.organizationId) || !hasIdentity(scope.locationId)) {
    return [];
  }

  const items = families.flatMap(({ family, partneringFamilyInfo }) => {
    const familyId = family?.id;
    if (!hasIdentity(familyId) || !partneringFamilyInfo) return [];

    const { openV1Case, closedV1Cases } = partneringFamilyInfo;
    const cases = openV1Case
      ? [openV1Case, ...(closedV1Cases ?? [])]
      : (closedV1Cases ?? []);

    return cases.flatMap(({ id: v1CaseId, arrangements }) => {
      if (!hasIdentity(v1CaseId)) return [];

      return (arrangements ?? []).flatMap(
        ({ id: arrangementId, missingRequirements }) => {
          if (!hasIdentity(arrangementId)) return [];

          const target = { familyId, v1CaseId, arrangementId };
          return (missingRequirements ?? []).flatMap((requirement) =>
            projectRequirement(scope, target, requirement)
          );
        }
      );
    });
  });

  return items.sort(
    (left, right) =>
      compareText(left.occurrenceDate, right.occurrenceDate) ||
      compareText(left.id, right.id) ||
      compareText(left.status, right.status) ||
      compareText(left.snoozeToken ?? '', right.snoozeToken ?? '')
  );
}
