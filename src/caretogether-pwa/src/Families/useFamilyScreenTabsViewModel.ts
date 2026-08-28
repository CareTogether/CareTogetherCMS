import { useMemo } from 'react';
import {
  CombinedFamilyInfo,
  NoteStatus,
  V1Case,
  V1Referral,
  V1ReferralNoteStatus,
} from '../GeneratedClient';
import { FamilyScreenTabValue } from './FamilyScreenTabsV2';

export type FamilyScreenTabModel = {
  count?: number;
  label: string;
  unapprovedCount?: number;
  value: FamilyScreenTabValue;
};

export type FamilyScreenTabsViewModel = {
  selectedTabIsInvalid: boolean;
  showApprovals: boolean;
  showArrangementsOrAssignments: boolean;
  showCaseHistory: boolean;
  showDocuments: boolean;
  showOverview: boolean;
  showTimelineAndNotes: boolean;
  tabs: FamilyScreenTabModel[];
};

type UseFamilyScreenTabsViewModelParameters = {
  allV1Cases: V1Case[];
  family?: CombinedFamilyInfo;
  familyReferrals: V1Referral[];
  selectedTab: FamilyScreenTabValue;
  selectedV1Case?: V1Case;
};

function familyDocumentsCount(
  family: CombinedFamilyInfo | undefined,
  familyReferrals: V1Referral[]
) {
  return (
    (family?.uploadedDocuments?.length ?? 0) +
    familyReferrals.reduce(
      (count, referral) => count + (referral.uploadedDocuments?.length ?? 0),
      0
    )
  );
}

function familyNotesCount(
  family: CombinedFamilyInfo | undefined,
  familyReferrals: V1Referral[]
) {
  const familyNoteCount = family?.notes?.length ?? 0;
  const referralNoteCount = familyReferrals.reduce(
    (count, referral) => count + (referral.notes?.length ?? 0),
    0
  );

  return familyNoteCount + referralNoteCount;
}

function unapprovedNotesCount(
  family: CombinedFamilyInfo | undefined,
  familyReferrals: V1Referral[]
) {
  return (
    (family?.notes?.filter((note) => note.status === NoteStatus.Draft).length ??
      0) +
    familyReferrals.reduce(
      (count, referral) =>
        count +
        (referral.notes?.filter(
          (note) => note.status === V1ReferralNoteStatus.Draft
        ).length ?? 0),
      0
    )
  );
}

export function useFamilyScreenTabsViewModel({
  allV1Cases,
  family,
  familyReferrals,
  selectedTab,
  selectedV1Case,
}: UseFamilyScreenTabsViewModelParameters): FamilyScreenTabsViewModel {
  return useMemo(() => {
    const isVolunteerFamily = family?.volunteerFamilyInfo != null;
    const isPartneringFamily = family?.partneringFamilyInfo != null;
    const arrangementOrAssignmentsTabLabel = isVolunteerFamily
      ? 'Assignments'
      : 'Arrangements';
    const arrangementOrAssignmentsCount = isVolunteerFamily
      ? (family?.volunteerFamilyInfo?.assignments?.length ?? 0)
      : (selectedV1Case?.arrangements?.length ?? 0);
    const tabs: FamilyScreenTabModel[] = [
      {
        value: 'overview',
        label: 'Overview',
      },
      ...(isVolunteerFamily
        ? [
            {
              value: 'approvals' as const,
              label: 'Approvals',
            },
          ]
        : []),
      {
        value: 'arrangementsOrAssignments',
        label: arrangementOrAssignmentsTabLabel,
        count: arrangementOrAssignmentsCount,
      },
      {
        value: 'documents',
        label: 'Documents',
        count: familyDocumentsCount(family, familyReferrals),
      },
      {
        value: 'timelineAndNotes',
        label: 'Timeline & Notes',
        count: familyNotesCount(family, familyReferrals),
        unapprovedCount: unapprovedNotesCount(family, familyReferrals),
      },
      ...(isPartneringFamily
        ? [
            {
              value: 'caseHistory' as const,
              label: 'Case History',
              count: allV1Cases.length,
            },
          ]
        : []),
    ];

    return {
      selectedTabIsInvalid:
        (selectedTab === 'approvals' && !isVolunteerFamily) ||
        (selectedTab === 'caseHistory' && !isPartneringFamily),
      showApprovals: selectedTab === 'approvals' && isVolunteerFamily,
      showArrangementsOrAssignments:
        selectedTab === 'arrangementsOrAssignments',
      showCaseHistory: selectedTab === 'caseHistory' && isPartneringFamily,
      showDocuments: selectedTab === 'documents',
      showOverview: selectedTab === 'overview',
      showTimelineAndNotes: selectedTab === 'timelineAndNotes',
      tabs,
    };
  }, [allV1Cases.length, family, familyReferrals, selectedTab, selectedV1Case]);
}
