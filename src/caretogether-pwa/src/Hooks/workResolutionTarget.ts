import type { ApprovalLedgerRow } from '../Approvals/approvalLedgerViewModel';
import type { IMissingArrangementRequirement } from '../GeneratedClient';

export type ApprovalNavigationTarget =
  | { kind: 'role'; name: string; personId?: string }
  | { kind: 'requirement'; name: string; personId?: string };

export function appendApprovalTarget(
  params: URLSearchParams,
  target: ApprovalNavigationTarget
) {
  params.set(
    target.kind === 'role' ? 'approvalRole' : 'approvalAction',
    target.name
  );
  if (target.personId) params.set('approvalPersonId', target.personId);
}

export function readApprovalTarget(
  params: URLSearchParams
): ApprovalNavigationTarget | undefined {
  const roles = params.getAll('approvalRole');
  const actions = params.getAll('approvalAction');
  const people = params.getAll('approvalPersonId');
  if (roles.length + actions.length !== 1 || people.length > 1) return;
  const name = roles[0] ?? actions[0];
  if (!name.trim() || (people.length && !people[0].trim())) return;
  return {
    kind: roles.length ? 'role' : 'requirement',
    name,
    personId: people[0],
  };
}

export function clearApprovalTarget(params: URLSearchParams) {
  const next = new URLSearchParams(params);
  for (const key of ['approvalRole', 'approvalAction', 'approvalPersonId'])
    next.delete(key);
  return next;
}

export function uniqueMatch<T>(
  items: readonly T[],
  matches: (item: T) => boolean
) {
  const found = items.filter(matches);
  return found.length === 1 ? found[0] : undefined;
}

export function findRenewalRow(
  rows: readonly ApprovalLedgerRow[],
  actionName: string,
  scope: 'family' | 'person' | 'organization',
  subjectId: string,
  affectedRoles: readonly string[]
) {
  return uniqueMatch(
    rows,
    (row) =>
      row.requirementName === actionName &&
      ['missing', 'expired', 'expiring'].includes(row.status) &&
      row.neededForRoles.some((role) => affectedRoles.includes(role)) &&
      row.occurrences.length > 0 &&
      row.occurrences.every(
        ({ subject, context }) =>
          subject.scope === scope &&
          (scope === 'family'
            ? context.kind === 'Volunteer Family' &&
              context.volunteerFamilyId === subjectId
            : subject.id === subjectId)
      )
  );
}

export type ArrangementRequirementTarget = {
  actionName: string;
  date: string;
  arrangementFunction?: string;
  arrangementFunctionVariant?: string;
  volunteerFamilyId?: string;
  personId?: string;
};

export function arrangementRequirementQuery(
  target: ArrangementRequirementTarget
) {
  return JSON.stringify([
    target.actionName,
    target.date,
    target.arrangementFunction ?? null,
    target.arrangementFunctionVariant ?? null,
    target.volunteerFamilyId ?? null,
    target.personId ?? null,
  ]);
}

export function findArrangementRequirement(
  rows: readonly IMissingArrangementRequirement[],
  query: string
) {
  return uniqueMatch(rows, (row) => {
    const date = row.dueBy ?? row.pastDueSince;
    if (
      !row.action?.isRequired ||
      !row.action.actionName ||
      !date ||
      !Number.isFinite(date.getTime())
    )
      return false;
    return (
      query ===
      arrangementRequirementQuery({
        actionName: row.action.actionName,
        date: date.toISOString().slice(0, 10),
        arrangementFunction: row.arrangementFunction,
        arrangementFunctionVariant: row.arrangementFunctionVariant,
        volunteerFamilyId: row.volunteerFamilyId,
        personId: row.personId,
      })
    );
  });
}
