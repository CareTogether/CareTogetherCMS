import { useMemo, useState } from 'react';
import type {
  CombinedFamilyInfo,
  V1Referral,
} from '../GeneratedClient';
import { usePersonLookup } from '../Model/DirectoryModel';
import {
  ActivitySorting,
  buildActivitiesWithEmbeddedNotes,
  buildInitialFamilyTimelineActivities,
  buildMergedTimelineModel,
  buildReferralTimelineItems,
  MergedTimelineItem,
} from './activityTimelineModel';

type UseActivityTimelineViewModelParameters = {
  family: CombinedFamilyInfo;
  referrals: V1Referral[];
};

export function useActivityTimelineViewModel({
  family,
  referrals,
}: UseActivityTimelineViewModelParameters) {
  const personLookup = usePersonLookup();

  const allActivitiesSorted = buildInitialFamilyTimelineActivities(family);

  function arrangementPartneringPerson(arrangementId?: string) {
    const allArrangements = (
      family.partneringFamilyInfo?.openV1Case?.arrangements || []
    ).concat(
      family.partneringFamilyInfo?.closedV1Cases?.flatMap(
        (r) => r.arrangements || []
      ) || []
    );
    const arrangement = allArrangements.find((a) => a.id === arrangementId);
    const partneringPerson = personLookup(
      family.family!.id!,
      arrangement?.partneringFamilyPersonId
    );
    return partneringPerson;
  }

  function documentLookup(uploadedDocumentId?: string) {
    const document = family.uploadedDocuments?.find(
      (d) => d.uploadedDocumentId === uploadedDocumentId
    );
    return document;
  }

  const [sortBy, setSortBy] = useState<ActivitySorting>('activity');

  const activitiesWithEmbeddedNotes = buildActivitiesWithEmbeddedNotes(
    family.notes || [],
    allActivitiesSorted
  );

  const referralTimelineItems = useMemo<MergedTimelineItem[]>(
    () => buildReferralTimelineItems(referrals),
    [referrals]
  );

  const { displayActivitiesWithNotes, mergedTimelineItems } =
    buildMergedTimelineModel(
      activitiesWithEmbeddedNotes,
      referralTimelineItems,
      sortBy
    );

  return {
    arrangementPartneringPerson,
    displayActivitiesWithNotes,
    documentLookup,
    mergedTimelineItems,
    personLookup,
    setSortBy,
    sortBy,
  };
}
