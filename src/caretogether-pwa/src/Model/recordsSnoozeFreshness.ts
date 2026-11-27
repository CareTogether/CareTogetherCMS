import type {
  CommunityRecordsAggregate,
  FamilyRecordsAggregate,
  RecordsAggregate,
  RequirementSnoozeFreshness,
} from '../GeneratedClient';

type Revisions = (number | undefined)[];
type FreshnessMark = { revisions: Revisions; policy: string | null };
type CertifiedRecord = FamilyRecordsAggregate | CommunityRecordsAggregate;

const revisionKeys = [
  'referralsRevision',
  'approvalsRevision',
  'directoryRevision',
  'organizationApprovalsRevision',
] as const satisfies readonly (keyof RequirementSnoozeFreshness)[];

function isCertifiable(record: RecordsAggregate): record is CertifiedRecord {
  return 'family' in record || 'community' in record;
}

function hasSnoozeToken(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasSnoozeToken);
  if (!value || typeof value !== 'object' || value instanceof Date)
    return false;
  return Object.entries(value).some(
    ([key, nested]) =>
      (key === 'snoozeEpisodeToken' && Boolean(nested)) ||
      hasSnoozeToken(nested)
  );
}

function removeSnoozeTokens(value: unknown) {
  if (Array.isArray(value)) {
    value.forEach(removeSnoozeTokens);
    return;
  }
  if (!value || typeof value !== 'object') return;
  const data = value as Record<string, unknown>;
  delete data.snoozeEpisodeToken;
  Object.values(data).forEach(removeSnoozeTokens);
}

function withoutSnoozeTokens(record: CertifiedRecord) {
  if (!hasSnoozeToken(record)) return record;
  const data: unknown = record.toJSON();
  removeSnoozeTokens(data);
  const type = record.constructor as unknown as {
    fromJS(data: unknown): CertifiedRecord;
  };
  return type.fromJS(data);
}

function readRevisions(
  freshness: RequirementSnoozeFreshness | undefined
): Revisions | undefined {
  if (!freshness?.policyRevision) return;
  const revisions = revisionKeys.map((key) => freshness[key]);
  return revisions[0] !== undefined &&
    revisions.every(
      (revision) => revision === undefined || Number.isSafeInteger(revision)
    )
    ? revisions
    : undefined;
}

function compare(incoming: Revisions, known: Revisions) {
  if (
    incoming.some(
      (revision, index) =>
        (revision === undefined) !== (known[index] === undefined)
    )
  )
    return 'incomparable';
  const pairs = incoming.flatMap((revision, index) =>
    revision === undefined ? [] : [[revision, known[index]!] as const]
  );
  if (pairs.every(([next, previous]) => next === previous)) return 'equal';
  if (pairs.every(([next, previous]) => next >= previous)) return 'newer';
  if (pairs.every(([next, previous]) => next <= previous)) return 'older';
  return 'incomparable';
}

export function createSnoozeFreshnessTracker() {
  const marks = new Map<string, FreshnessMark>();

  function admit(record: RecordsAggregate): RecordsAggregate {
    if (!isCertifiable(record)) return record;

    const revisions = readRevisions(record.snoozeFreshness);
    const policy = record.snoozeFreshness?.policyRevision;
    if (!record.id || !revisions || !policy) return withoutSnoozeTokens(record);

    const mark = marks.get(record.id);
    const comparison = mark ? compare(revisions, mark.revisions) : 'newer';
    if (comparison === 'newer') {
      marks.set(record.id, { revisions, policy });
      return record;
    }
    if (comparison === 'equal' && mark?.policy === policy) return record;
    if (mark && comparison === 'equal')
      marks.set(record.id, { revisions, policy: null });
    if (mark && comparison === 'incomparable')
      marks.set(record.id, {
        revisions: revisions.map((revision, index) =>
          revision === undefined || mark.revisions[index] === undefined
            ? (revision ?? mark.revisions[index])
            : Math.max(revision, mark.revisions[index]!)
        ),
        policy: null,
      });
    return withoutSnoozeTokens(record);
  }

  return (records: RecordsAggregate[]) => {
    const admitted = records.map(admit);
    return admitted.every((record, index) => record === records[index])
      ? records
      : admitted;
  };
}
