import { useState } from 'react';
import {
  Arrangement,
  ChildInvolvement,
  ChildLocationHistoryEntry,
  ChildLocationPlan,
  CombinedFamilyInfo,
  Person,
} from '../../GeneratedClient';
import { useFamilyLookup, usePersonLookup } from '../../Model/DirectoryModel';
import { usePolicy } from '../../Model/PolicyModel';
import {
  arrangementHasNotStarted,
  childLocationAssigneeKey,
} from './childLocationModel';
import { useChildLocationTimelineViewModel } from './useChildLocationTimelineViewModel';

type UseTrackChildLocationViewModelParameters = {
  arrangement: Arrangement;
  initialMode?: 'record' | 'plan';
  initialPlannedEntry?: ChildLocationHistoryEntry;
  partneringFamily: CombinedFamilyInfo;
};

function candidateItem(candidate: { familyId: string; adult: Person }) {
  return {
    familyId: candidate.familyId,
    personId: candidate.adult.id!,
    key: `${candidate.familyId}|${candidate.adult.id!}`,
    displayName: `${candidate.adult.firstName} ${candidate.adult.lastName}`,
  };
}

export function useTrackChildLocationViewModel({
  arrangement,
  initialMode,
  initialPlannedEntry,
  partneringFamily,
}: UseTrackChildLocationViewModelParameters) {
  const policy = usePolicy();
  const arrangementPolicy = policy.referralPolicy!.arrangementPolicies!.find(
    (x) => x.arrangementType === arrangement.arrangementType
  );
  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();
  const timelineViewModel = useChildLocationTimelineViewModel({ arrangement });

  const child = personLookup(
    partneringFamily.family!.id,
    arrangement.partneringFamilyPersonId
  );

  const arrangementHasNotStartedYet = arrangementHasNotStarted(arrangement);

  const initialTabValue =
    initialPlannedEntry || initialMode === 'record'
      ? 0
      : initialMode === 'plan' || arrangementHasNotStartedYet
        ? 1
        : 0;
  const [tabValue, setTabValue] = useState(initialTabValue);
  const [selectedAssigneeKey, setSelectedAssigneeKey] = useState(
    initialPlannedEntry ? childLocationAssigneeKey(initialPlannedEntry) : ''
  );
  const [changeAtLocal, setChangeAtLocal] = useState(
    initialPlannedEntry?.timestampUtc ?? (null as Date | null)
  );
  const [plan, setPlan] = useState<ChildLocationPlan | null>(
    initialPlannedEntry?.plan ?? null
  );
  const [notes, setNotes] = useState('');

  function recordChildLocationPlan(entry: ChildLocationHistoryEntry) {
    setTabValue(0);
    setSelectedAssigneeKey(childLocationAssigneeKey(entry));
    setChangeAtLocal(entry.timestampUtc!);
    setPlan(entry.plan!);
  }

  const candidatePartneringFamilyAssignees = (
    partneringFamily.family?.adults?.map((adultInfo) => ({
      familyId: partneringFamily.family!.id!,
      adult: adultInfo.item1!,
    })) || []
  ).map(candidateItem);
  const candidateFamilyAssignees =
    arrangement.familyVolunteerAssignments?.flatMap(
      (familyAssignment) =>
        familyLookup(familyAssignment.familyId)?.family?.adults?.map(
          (adultInfo) => ({
            familyId: familyAssignment.familyId!,
            adult: adultInfo.item1!,
          })
        ) || []
    ) || [];
  const candidateIndividualAssignees =
    arrangement.individualVolunteerAssignments?.map((individualAssignment) => ({
      familyId: individualAssignment.familyId!,
      adult: personLookup(
        individualAssignment.familyId,
        individualAssignment.personId
      )!,
    })) || [];
  const allCandidateVolunteerAssignees = candidateFamilyAssignees
    .concat(candidateIndividualAssignees)
    .map(candidateItem);
  const deduplicatedCandidateVolunteerAssignees =
    allCandidateVolunteerAssignees.filter(
      (candidateItem, i) =>
        allCandidateVolunteerAssignees.filter(
          (x, j) => x.key === candidateItem.key && j < i
        ).length === 0
    );

  function updateAssignee(assigneeKey: string) {
    setSelectedAssigneeKey(assigneeKey);
    const assigneeIsFromPartneringFamily =
      candidatePartneringFamilyAssignees.some((ca) => ca.key === assigneeKey);
    if (assigneeIsFromPartneringFamily) {
      setPlan(ChildLocationPlan.WithParent);
    } else {
      if (plan === ChildLocationPlan.WithParent) {
        setPlan(
          arrangementPolicy?.childInvolvement ===
            ChildInvolvement.DaytimeChildCareOnly
            ? ChildLocationPlan.DaytimeChildCare
            : null
        );
      } else if (
        arrangementPolicy?.childInvolvement ===
        ChildInvolvement.DaytimeChildCareOnly
      ) {
        setPlan(ChildLocationPlan.DaytimeChildCare);
      }
    }
  }

  const assigneeIsFromPartneringFamily =
    candidatePartneringFamilyAssignees.some(
      (ca) => ca.key === selectedAssigneeKey
    );
  const selectedAssignee = candidatePartneringFamilyAssignees
    .concat(deduplicatedCandidateVolunteerAssignees)
    .find((ca) => ca.key === selectedAssigneeKey);
  const canSave =
    tabValue === 0
      ? selectedAssigneeKey !== '' &&
        plan != null &&
        notes !== '' &&
        changeAtLocal != null
      : selectedAssigneeKey !== '' && plan != null && changeAtLocal != null;

  return {
    arrangementHasNotStartedYet,
    arrangementPolicy,
    assigneeIsFromPartneringFamily,
    canSave,
    candidatePartneringFamilyAssignees,
    changeAtLocal,
    child,
    deduplicatedCandidateVolunteerAssignees,
    notes,
    plan,
    recordChildLocationPlan,
    selectedAssignee,
    selectedAssigneeKey,
    setChangeAtLocal,
    setNotes,
    setPlan,
    setTabValue,
    tabValue,
    timelineViewModel,
    updateAssignee,
  };
}
