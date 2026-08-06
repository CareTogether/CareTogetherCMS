import { useMemo } from 'react';
import {
  Activity,
  ArrangementRequirementCompleted,
  ChildLocationChanged,
  CombinedFamilyInfo,
  CommunityInfo,
  CompletedCustomFieldInfo,
  EffectiveLocationPolicy,
  Note,
  Permission,
  ReferralOpened as V1CaseOpened,
  ReferralRequirementCompleted as V1CaseRequirementCompleted,
  V1Case,
  V1Referral,
} from '../GeneratedClient';
import { buildGroupedV1ReferralTimelineEntries } from '../V1Referrals/referralTimelineHelpers';
import {
  buildPrintableCustomFieldSections,
  type PrintableFamilyMember,
} from './FamilyMemberPrintData';
import { combineCustomFieldPolicies } from './familyMemberCustomFieldPolicies';
import { buildFamilyMemberRowsV2 } from './familyMemberViewModel';
import { RecentOverviewTimelineItem } from './FamilyRecentOverviewV2';

type CustomFieldRenderInfo = CompletedCustomFieldInfo | string;
type ReferralNoteEntry = NonNullable<V1Referral['notes']>[number];

type UseFamilyOverviewViewModelParameters = {
  allV1Cases: V1Case[];
  canViewFamilyCustomFields: boolean;
  canViewV1CaseCustomFields: boolean;
  family?: CombinedFamilyInfo;
  familyCommunityInfo: CommunityInfo[];
  familyMemberToPrint: PrintableFamilyMember | null;
  familyReferrals: V1Referral[];
  permissions: (permission: Permission) => boolean;
  policy: EffectiveLocationPolicy;
  selectedV1Case?: V1Case;
};

function customFieldName(customField: CustomFieldRenderInfo) {
  return customField instanceof CompletedCustomFieldInfo
    ? customField.customFieldName!
    : customField;
}

function orderCustomFieldsByPolicy(
  customFields: CustomFieldRenderInfo[],
  policyFieldNames: string[]
) {
  const customFieldsByName = new Map(
    customFields.map((customField) => [
      customFieldName(customField),
      customField,
    ])
  );

  return policyFieldNames.flatMap((fieldName) => {
    const customField = customFieldsByName.get(fieldName);
    return customField === undefined ? [] : [customField];
  });
}

function getDateValue(value?: Date | string | null): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  return new Date(value).getTime();
}

function getNoteTimestamp(note: Note | ReferralNoteEntry) {
  return (
    note.backdatedTimestampUtc ??
    note.createdTimestampUtc ??
    note.lastEditTimestampUtc
  );
}

function recentActivityTitle(activity: Activity) {
  if (
    activity instanceof V1CaseRequirementCompleted ||
    activity instanceof ArrangementRequirementCompleted
  ) {
    return activity.requirementName || 'Requirement completed';
  }

  if (activity instanceof ChildLocationChanged) {
    return 'Child location changed';
  }

  if (activity instanceof V1CaseOpened) {
    return 'Case opened';
  }

  if (activity.uploadedDocumentId) {
    return 'Document uploaded';
  }

  return 'Family activity';
}

function recentActivityIcon(
  activity: Activity
): RecentOverviewTimelineItem['icon'] {
  if (
    activity instanceof V1CaseRequirementCompleted ||
    activity instanceof ArrangementRequirementCompleted
  ) {
    return 'check';
  }

  if (activity instanceof ChildLocationChanged) {
    return 'location';
  }

  return 'edit';
}

export function useFamilyOverviewViewModel({
  allV1Cases,
  canViewFamilyCustomFields,
  canViewV1CaseCustomFields,
  family,
  familyCommunityInfo,
  familyMemberToPrint,
  familyReferrals,
  permissions,
  policy,
  selectedV1Case,
}: UseFamilyOverviewViewModelParameters) {
  const activeAdults = useMemo<PrintableFamilyMember[]>(() => {
    return (family?.family?.adults ?? []).flatMap((adult) =>
      adult.item1?.id && adult.item1.active && adult.item2
        ? [
            {
              kind: 'adult' as const,
              person: adult.item1,
              relationshipToFamily: adult.item2,
            },
          ]
        : []
    );
  }, [family?.family?.adults]);

  const activeChildren = useMemo<PrintableFamilyMember[]>(() => {
    return (family?.family?.children ?? []).flatMap((child) =>
      child.id && child.active
        ? [
            {
              kind: 'child' as const,
              person: child,
            },
          ]
        : []
    );
  }, [family?.family?.children]);

  const familyMemberRows = useMemo(
    () =>
      family
        ? buildFamilyMemberRowsV2({
            family,
            permissions,
            v1Cases: allV1Cases,
          })
        : [],
    [allV1Cases, family, permissions]
  );

  const printableFamilyMembers = useMemo(
    () => activeAdults.concat(activeChildren),
    [activeAdults, activeChildren]
  );

  const adultCustomFieldPolicies = useMemo(
    () =>
      combineCustomFieldPolicies(
        family?.partneringFamilyInfo != null
          ? (policy.customFields?.partneringFamily?.adult ?? [])
          : [],
        family?.volunteerFamilyInfo != null
          ? (policy.customFields?.volunteerFamily?.adult ?? [])
          : []
      ),
    [
      family?.partneringFamilyInfo,
      family?.volunteerFamilyInfo,
      policy.customFields?.partneringFamily?.adult,
      policy.customFields?.volunteerFamily?.adult,
    ]
  );

  const childCustomFieldPolicies = useMemo(
    () =>
      combineCustomFieldPolicies(
        family?.partneringFamilyInfo != null
          ? (policy.customFields?.partneringFamily?.child ?? [])
          : [],
        family?.volunteerFamilyInfo != null
          ? (policy.customFields?.volunteerFamily?.child ?? [])
          : []
      ),
    [
      family?.partneringFamilyInfo,
      family?.volunteerFamilyInfo,
      policy.customFields?.partneringFamily?.child,
      policy.customFields?.volunteerFamily?.child,
    ]
  );

  const familyMemberPrintCustomFieldSections = useMemo(() => {
    if (!familyMemberToPrint) return [];
    if (!canViewFamilyCustomFields) return [];

    return buildPrintableCustomFieldSections(
      familyMemberToPrint.person.completedCustomFields,
      familyMemberToPrint.kind === 'adult'
        ? adultCustomFieldPolicies
        : childCustomFieldPolicies
    );
  }, [
    adultCustomFieldPolicies,
    canViewFamilyCustomFields,
    childCustomFieldPolicies,
    familyMemberToPrint,
  ]);

  const pinnedNotes = useMemo(() => {
    return (family?.notes ?? [])
      .filter((note) => note.isPinned)
      .sort(
        (a, b) =>
          getDateValue(b.pinnedAtUtc ?? getNoteTimestamp(b)) -
          getDateValue(a.pinnedAtUtc ?? getNoteTimestamp(a))
      );
  }, [family?.notes]);

  const recentOverviewTimelineItems = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const familyActivityRecords = [
      ...(family?.partneringFamilyInfo?.history ?? []),
      ...(family?.volunteerFamilyInfo?.history ?? []),
    ];
    const familyNotesById = new Map(
      (family?.notes ?? []).map((note) => [note.id, note])
    );
    const linkedFamilyNoteIds = new Set(
      familyActivityRecords.flatMap((activity) =>
        activity.noteId ? [activity.noteId] : []
      )
    );

    const familyActivities: RecentOverviewTimelineItem[] =
      familyActivityRecords.map((activity) => {
        const linkedNote = activity.noteId
          ? familyNotesById.get(activity.noteId)
          : undefined;

        return {
          id: `activity:${activity.auditTimestampUtc?.toISOString()}`,
          activity,
          timestamp: activity.activityTimestampUtc,
          title: recentActivityTitle(activity),
          subtitle: linkedNote?.contents?.trim(),
          userId: activity.userId,
          note: linkedNote,
          icon: recentActivityIcon(activity),
        };
      });

    const familyNotes: RecentOverviewTimelineItem[] =
      family?.notes
        ?.filter((note) => !linkedFamilyNoteIds.has(note.id))
        .map((note) => ({
          id: `note:${note.id}`,
          timestamp: getNoteTimestamp(note),
          title: 'Family note',
          subtitle: note.contents?.trim(),
          userId: note.authorUserId,
          note,
          icon: 'edit',
        })) ?? [];

    const referralActivities: RecentOverviewTimelineItem[] =
      familyReferrals.flatMap((referral) =>
        buildGroupedV1ReferralTimelineEntries(referral).map((entry) => ({
          id: `referral-${entry.kind}:${referral.referralId}:${entry.timestamp.toISOString()}`,
          timestamp: entry.timestamp,
          title: entry.label,
          subtitle:
            entry.kind === 'note'
              ? entry.note.contents?.trim()
              : `Referral: ${referral.title}`,
          userId: entry.userId,
          referralNote: entry.kind === 'note' ? entry.note : undefined,
          referralId: referral.referralId,
          icon: 'edit',
        }))
      );

    return [...familyActivities, ...familyNotes, ...referralActivities]
      .filter((item) => {
        const timestamp = getDateValue(item.timestamp);
        return (
          timestamp >= sevenDaysAgo.getTime() && timestamp <= now.getTime()
        );
      })
      .sort((a, b) => getDateValue(b.timestamp) - getDateValue(a.timestamp))
      .slice(0, 6);
  }, [
    family?.notes,
    family?.partneringFamilyInfo?.history,
    family?.volunteerFamilyInfo?.history,
    familyReferrals,
  ]);

  const overviewFamilyCustomFields = canViewFamilyCustomFields
    ? orderCustomFieldsByPolicy(
        Array<CustomFieldRenderInfo>()
          .concat(family?.family?.completedCustomFields ?? [])
          .concat(family?.missingCustomFields || []),
        policy.customFamilyFields?.map((field) => field.name) ?? []
      )
    : [];

  const overviewVolunteerFamilyCustomFields =
    canViewFamilyCustomFields && family?.volunteerFamilyInfo
      ? orderCustomFieldsByPolicy(
          Array<CustomFieldRenderInfo>()
            .concat(family.volunteerFamilyInfo.completedCustomFields || [])
            .concat(family.volunteerFamilyInfo.missingCustomFields || []),
          policy.volunteerPolicy?.customFields?.map((field) => field.name) ?? []
        )
      : [];

  const overviewV1CaseCustomFields = canViewV1CaseCustomFields
    ? (
        selectedV1Case?.completedCustomFields ||
        ([] as Array<CompletedCustomFieldInfo | string>)
      )
        .concat(selectedV1Case?.missingCustomFields || [])
        .sort((a, b) =>
          (a instanceof CompletedCustomFieldInfo ? a.customFieldName! : a) <
          (b instanceof CompletedCustomFieldInfo ? b.customFieldName! : b)
            ? -1
            : (a instanceof CompletedCustomFieldInfo
                  ? a.customFieldName!
                  : a) >
                (b instanceof CompletedCustomFieldInfo
                  ? b.customFieldName!
                  : b)
              ? 1
              : 0
        )
    : [];

  const overviewCommunityRows = familyCommunityInfo.map((communityInfo) => ({
    id: communityInfo.community?.id,
    name: communityInfo.community?.name,
  }));

  return {
    activeAdults,
    activeChildren,
    familyMemberPrintCustomFieldSections,
    familyMemberRows,
    overviewCommunityRows,
    overviewFamilyCustomFields,
    overviewV1CaseCustomFields,
    overviewVolunteerFamilyCustomFields,
    pinnedNotes,
    printableFamilyMembers,
    recentOverviewTimelineItems,
  };
}
