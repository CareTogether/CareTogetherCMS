import {
  Activity,
  ArrangementRequirementCompleted,
  ChildLocationChanged,
  CombinedFamilyInfo,
  Note,
  ReferralOpened as V1CaseOpened,
  ReferralRequirementCompleted as V1CaseRequirementCompleted,
  V1Referral,
} from '../GeneratedClient';

export type ActivitySorting = 'activity' | 'created' | 'edited' | 'approved';

type ReferralNoteEntry = NonNullable<V1Referral['notes']>[number];

export type MergedTimelineItem =
  | {
      kind: 'family-activity';
      timestamp: Date;
      userId?: string;
      activity: Activity;
      note?: Note;
    }
  | {
      kind: 'referral';
      timestamp: Date;
      userId?: string;
      label: string;
      referralId: string;
      referralTitle: string;
      documentName?: string | null;
      note?: ReferralNoteEntry;
    }
  | {
      kind: 'referral-note';
      timestamp: Date;
      userId?: string;
      label: string;
      referralId: string;
      referralTitle: string;
      referralNote: ReferralNoteEntry;
    };

function dateKey(value?: Date | null): string {
  return value?.toISOString() ?? 'none';
}

function activityKey(activity: Activity): string {
  return [
    activity.constructor.name,
    dateKey(activity.auditTimestampUtc),
    dateKey(activity.activityTimestampUtc),
    activity.userId ?? 'none',
    activity.uploadedDocumentId ?? 'none',
    activity.noteId ?? 'none',
  ].join(':');
}

export function getTimelineItemKey(item: MergedTimelineItem): string {
  if (item.kind === 'family-activity') {
    return item.note?.id
      ? `family-note:${item.note.id}`
      : `family-activity:${activityKey(item.activity)}`;
  }

  if (item.kind === 'referral-note') {
    return `referral-note:${item.referralId}:${item.referralNote.id}`;
  }

  if (item.note?.id) {
    return `referral-activity-note:${item.referralId}:${item.note.id}`;
  }

  if (item.documentName) {
    return `referral-document:${item.referralId}:${dateKey(item.timestamp)}:${item.documentName}`;
  }

  return `referral-activity:${item.referralId}:${dateKey(item.timestamp)}:${item.label}:${item.userId ?? 'none'}`;
}

export function buildFamilyActivities(family: CombinedFamilyInfo): Activity[] {
  return (family.partneringFamilyInfo?.history?.slice() || []).concat(
    family.volunteerFamilyInfo?.history?.slice() || []
  );
}

export function buildSyntheticNoteActivities(
  notes: Note[] | undefined,
  activities: Activity[]
): Activity[] {
  return (
    notes
      ?.filter((note) => activities?.every((a) => a.noteId !== note.id))
      ?.map(
        (note) =>
          ({
            userId: note.authorUserId ?? '',
            activityTimestampUtc:
              note.backdatedTimestampUtc ??
              note.createdTimestampUtc ??
              note.lastEditTimestampUtc,
            auditTimestampUtc: note.createdTimestampUtc ?? note.lastEditTimestampUtc,
            noteId: note.id,
          }) as Activity
      ) || []
  );
}

export function buildInitialFamilyTimelineActivities(
  family: CombinedFamilyInfo
): Activity[] {
  const activities = buildFamilyActivities(family);
  const unmatchedNotesAsActivities = buildSyntheticNoteActivities(
    family.notes,
    activities
  );

  return activities.concat(unmatchedNotesAsActivities).sort((a, b) =>
    a.activityTimestampUtc! < b.activityTimestampUtc!
      ? 1
      : a.activityTimestampUtc! > b.activityTimestampUtc!
        ? -1
        : 0
  );
}

export const composeNoteType = (activity: Activity): string | null => {
  if (activity instanceof V1CaseRequirementCompleted) {
    return 'Case requirement completed';
  }

  if (activity instanceof ArrangementRequirementCompleted) {
    return 'Arrangement requirement completed';
  }

  if (activity instanceof ChildLocationChanged) {
    return 'Child location changed';
  }

  if (activity instanceof V1CaseOpened) {
    return 'Case opened';
  }

  return null;
};

export const getDateValue = (value?: string | Date | null): number => {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  return new Date(value).getTime();
};
