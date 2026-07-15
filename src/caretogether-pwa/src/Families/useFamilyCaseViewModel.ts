import { useMemo } from 'react';
import {
  Arrangement,
  ArrangementPhase,
  CombinedFamilyInfo,
  EffectiveLocationPolicy,
  V1Case,
  V1Referral,
  V1ReferralStatus,
} from '../GeneratedClient';
import { getFilteredArrangements } from '../V1Cases/Arrangements/ArrangementsSection/getFilteredArrangements';
import {
  ArrangementRowV2,
  buildArrangementRowsV2,
} from '../V1Cases/Arrangements/arrangementViewModel';
import { ActiveCaseArrangementSummaryV2 } from './FamilyCaseWorkspaceHeaderV2';

type UseFamilyCaseViewModelParameters = {
  allV1Cases: V1Case[];
  family?: CombinedFamilyInfo;
  familyLabel: (familyId?: string) => string;
  familyReferrals: V1Referral[];
  personLabel: (familyId?: string, personId?: string) => string;
  policy: EffectiveLocationPolicy;
  selectedArrangementRowId: string | null;
  selectedV1CaseId?: string;
};

function isActiveCaseArrangement(arrangement: Arrangement) {
  return (
    arrangement.phase === ArrangementPhase.SettingUp ||
    arrangement.phase === ArrangementPhase.ReadyToStart ||
    arrangement.phase === ArrangementPhase.Started
  );
}

function activeArrangementStatusLabel(phase?: ArrangementPhase) {
  if (phase === ArrangementPhase.SettingUp) return 'Setting up';
  if (phase === ArrangementPhase.ReadyToStart) return 'Ready to start';
  if (phase === ArrangementPhase.Started) return 'Active';
  return 'Active';
}

export function useFamilyCaseViewModel({
  allV1Cases,
  family,
  familyLabel,
  familyReferrals,
  personLabel,
  policy,
  selectedArrangementRowId,
  selectedV1CaseId,
}: UseFamilyCaseViewModelParameters) {
  const selectedV1Case = useMemo(
    () => allV1Cases.find((v1Case) => v1Case.id === selectedV1CaseId),
    [allV1Cases, selectedV1CaseId]
  );

  const caseReferralTable = useMemo(() => {
    const linkedReferralIds = new Set(
      allV1Cases.flatMap((v1Case) => v1Case.linkedV1ReferralIds ?? [])
    );

    const unlinkedReferrals = familyReferrals.filter(
      (referral) => !linkedReferralIds.has(referral.referralId)
    );

    const caseRows = allV1Cases.map((v1Case) => {
      const caseLinkedReferralIds = new Set(v1Case.linkedV1ReferralIds ?? []);
      const linkedReferrals = familyReferrals.filter((referral) =>
        caseLinkedReferralIds.has(referral.referralId)
      );

      return { v1Case, linkedReferrals };
    });

    return { caseRows, unlinkedReferrals };
  }, [allV1Cases, familyReferrals]);

  const currentReferral = useMemo(() => {
    const selectedCaseRow = caseReferralTable.caseRows.find(
      ({ v1Case }) => v1Case.id === selectedV1Case?.id
    );

    return (
      selectedCaseRow?.linkedReferrals[0] ??
      familyReferrals.find(
        (referral) => referral.status === V1ReferralStatus.Open
      )
    );
  }, [caseReferralTable.caseRows, familyReferrals, selectedV1Case?.id]);

  const openReferralId = useMemo(
    () =>
      familyReferrals.find((referral) => referral.status === V1ReferralStatus.Open)
        ?.referralId,
    [familyReferrals]
  );

  const selectedCaseArrangementRows = useMemo<ArrangementRowV2[]>(() => {
    if (!family || !selectedV1Case) return [];

    return buildArrangementRowsV2({
      arrangements: getFilteredArrangements(selectedV1Case, []),
      arrangementPolicies: policy.referralPolicy?.arrangementPolicies,
      family,
      v1Case: selectedV1Case,
      personLabel,
      familyLabel,
    });
  }, [family, familyLabel, personLabel, policy, selectedV1Case]);

  const selectedArrangementRow = useMemo(
    () =>
      selectedCaseArrangementRows.find(
        (row) => row.id === selectedArrangementRowId
      ) ?? null,
    [selectedCaseArrangementRows, selectedArrangementRowId]
  );

  const activeCaseArrangements = useMemo<
    ActiveCaseArrangementSummaryV2[]
  >(() => {
    return selectedCaseArrangementRows
      .filter((row) => row.id && isActiveCaseArrangement(row.source))
      .map((row) => {
        return {
          id: row.id,
          arrangementType: row.arrangementType,
          arrangedPersonLabel: row.childOrPersonLabel || 'Unassigned',
          currentLocationLabel:
            row.currentLocationLabel || 'Location unspecified',
          phase: row.source.phase,
          relevantDateLabel: row.startedDate
            ? `Started ${row.startedDate}`
            : row.requestedDate
              ? `Requested ${row.requestedDate}`
              : undefined,
          statusLabel: activeArrangementStatusLabel(row.source.phase),
        };
      });
  }, [selectedCaseArrangementRows]);

  return {
    activeCaseArrangements,
    caseReferralTable,
    currentReferral,
    openReferralId,
    selectedArrangementRow,
    selectedCaseArrangementRows,
    selectedV1Case,
  };
}
