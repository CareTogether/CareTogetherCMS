import type {
  FamilyRecordsAggregate,
  RecordsAggregate,
} from '../GeneratedClient';

type FreshnessMark = { revision: number; policy: string | null };

type RequirementData = { snoozeEpisodeToken?: string };
type CaseData = {
  arrangements?: { missingRequirements?: RequirementData[] }[];
};
type FamilyData = {
  family?: {
    partneringFamilyInfo?: {
      openV1Case?: CaseData;
      closedV1Cases?: CaseData[];
    };
  };
};

function isFamilyRecord(
  record: RecordsAggregate
): record is FamilyRecordsAggregate {
  return 'family' in record;
}

function requirements(family: FamilyData) {
  const info = family.family?.partneringFamilyInfo;
  const cases = info ? [info.openV1Case, ...(info.closedV1Cases ?? [])] : [];
  return cases.flatMap((v1Case) =>
    (v1Case?.arrangements ?? []).flatMap(
      (arrangement) => arrangement.missingRequirements ?? []
    )
  );
}

function withoutSnoozeTokens(record: FamilyRecordsAggregate) {
  if (
    !requirements(record as FamilyData).some(
      (requirement) => requirement.snoozeEpisodeToken
    )
  )
    return record;

  const data: FamilyData = record.toJSON();
  for (const requirement of requirements(data))
    delete requirement.snoozeEpisodeToken;
  const type = record.constructor as unknown as {
    fromJS(data: unknown): FamilyRecordsAggregate;
  };
  return type.fromJS(data);
}

export function createSnoozeFreshnessTracker() {
  const marks = new Map<string, FreshnessMark>();

  function admit(record: RecordsAggregate): RecordsAggregate {
    if (!isFamilyRecord(record)) return record;

    const revision = record.snoozeFreshness?.referralsRevision;
    const policy = record.snoozeFreshness?.policyRevision;
    if (
      !record.id ||
      !Number.isSafeInteger(revision) ||
      typeof revision !== 'number' ||
      !policy
    )
      return withoutSnoozeTokens(record);

    const mark = marks.get(record.id);
    if (!mark || revision > mark.revision) {
      marks.set(record.id, { revision, policy });
      return record;
    }
    if (revision === mark.revision && mark.policy === policy) return record;
    if (revision === mark.revision)
      marks.set(record.id, { revision, policy: null });
    return withoutSnoozeTokens(record);
  }

  return (records: RecordsAggregate[]) => {
    const admitted = records.map(admit);
    return admitted.every((record, index) => record === records[index])
      ? records
      : admitted;
  };
}
