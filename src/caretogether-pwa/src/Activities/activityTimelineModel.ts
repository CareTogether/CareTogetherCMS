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
import { buildGroupedV1ReferralTimelineEntries } from '../V1Referrals/referralTimelineHelpers';

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

export type ActivityWithNote = {
  activity: Activity;
  note: Note | undefined;
};

export type MergedTimelineModel = {
  displayActivitiesWithNotes: ActivityWithNote[];
  mergedTimelineItems: MergedTimelineItem[];
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

export function buildReferralTimelineItems(
  referrals: V1Referral[]
): MergedTimelineItem[] {
  return referrals.flatMap((referral) => {
    return buildGroupedV1ReferralTimelineEntries(referral).map((entry) => {
      if (entry.kind === 'note') {
        return {
          kind: 'referral-note',
          timestamp: entry.timestamp,
          userId: entry.userId,
          label: entry.label,
          referralId: referral.referralId,
          referralTitle: referral.title,
          referralNote: entry.note,
        };
      }

      return {
        kind: 'referral',
        timestamp: entry.timestamp,
        userId: entry.userId,
        label: entry.label,
        referralId: referral.referralId,
        referralTitle: referral.title,
        documentName:
          entry.kind === 'activity' ? entry.document?.uploadedFileName : undefined,
        note: entry.kind === 'activity' ? entry.note : undefined,
      };
    });
  });
}

const activityWithNoteSortStrategies: Record<
  ActivitySorting,
  (a: ActivityWithNote, b: ActivityWithNote) => number
> = {
  created: (a, b) =>
    getDateValue(b.note?.createdTimestampUtc ?? b.activity.activityTimestampUtc) -
    getDateValue(a.note?.createdTimestampUtc ?? a.activity.activityTimestampUtc),
  edited: (a, b) =>
    getDateValue(b.note?.lastEditTimestampUtc ?? b.activity.activityTimestampUtc) -
    getDateValue(a.note?.lastEditTimestampUtc ?? a.activity.activityTimestampUtc),
  approved: (a, b) =>
    getDateValue(b.note?.approvedTimestampUtc ?? b.activity.activityTimestampUtc) -
    getDateValue(a.note?.approvedTimestampUtc ?? a.activity.activityTimestampUtc),
  activity: (a, b) =>
    getDateValue(b.activity.activityTimestampUtc) -
    getDateValue(a.activity.activityTimestampUtc),
};

export function buildMergedTimelineModel(
  activitiesWithEmbeddedNotes: ActivityWithNote[],
  referralTimelineItems: MergedTimelineItem[],
  sortBy: ActivitySorting
): MergedTimelineModel {
  const sortedActivitiesWithNotes = [...activitiesWithEmbeddedNotes].sort(
    activityWithNoteSortStrategies[sortBy]
  );

  const pinnedActivitiesWithNotes = sortedActivitiesWithNotes
    .filter((item) => item.note?.isPinned)
    .sort(
      (a, b) =>
        getDateValue(b.note?.pinnedAtUtc ?? b.activity.activityTimestampUtc) -
        getDateValue(a.note?.pinnedAtUtc ?? a.activity.activityTimestampUtc)
    );

  const unpinnedActivitiesWithNotes = sortedActivitiesWithNotes.filter(
    (item) => !item.note?.isPinned
  );

  const displayActivitiesWithNotes = [
    ...pinnedActivitiesWithNotes,
    ...unpinnedActivitiesWithNotes,
  ].filter((item) => Boolean(item.note));

  const pinnedFamilyTimelineItems: MergedTimelineItem[] =
    pinnedActivitiesWithNotes.map(({ activity, note }) => ({
      kind: 'family-activity',
      timestamp: activity.activityTimestampUtc ?? new Date(0),
      userId: activity.userId,
      activity,
      note,
    }));

  const unpinnedFamilyTimelineItems: MergedTimelineItem[] =
    unpinnedActivitiesWithNotes.map(({ activity, note }) => ({
      kind: 'family-activity',
      timestamp: activity.activityTimestampUtc ?? new Date(0),
      userId: activity.userId,
      activity,
      note,
    }));

  const mergedTimelineItems = [
    ...pinnedFamilyTimelineItems,
    ...[...unpinnedFamilyTimelineItems, ...referralTimelineItems].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    ),
  ];

  return {
    displayActivitiesWithNotes,
    mergedTimelineItems,
  };
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
