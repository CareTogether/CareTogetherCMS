import { useEffect, useMemo, useRef, useState } from 'react';
import posthog from 'posthog-js';
import { useLocation } from 'react-router-dom';
import type {
  CombinedFamilyInfo,
  EffectiveLocationPolicy,
  V1Case,
  V1Referral,
} from '../GeneratedClient';
import { useSyncV1CaseIdInURL } from '../Hooks/useSyncV1CaseIdInURL';
import { useFamilyLookup, usePersonLookup } from '../Model/DirectoryModel';
import { personNameString } from './PersonName';
import type { FamilyScreenTabValue } from './FamilyScreenTabsV2';
import { useFamilyCaseViewModel } from './useFamilyCaseViewModel';

function stringFromLocationState(state: unknown, key: string) {
  if (!state || typeof state !== 'object' || !(key in state)) {
    return undefined;
  }

  const value = (state as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : undefined;
}

type UseFamilyCaseSelectionControllerParameters = {
  family?: CombinedFamilyInfo;
  familyId: string;
  familyReferrals: V1Referral[];
  policy: EffectiveLocationPolicy;
};

export function useFamilyCaseSelectionController({
  family,
  familyId,
  familyReferrals,
  policy,
}: UseFamilyCaseSelectionControllerParameters) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const v1CaseIdFromQuery = searchParams.get('v1CaseId') ?? undefined;
  const v1CaseIdFromState = stringFromLocationState(location.state, 'v1CaseId');
  const v1CaseIdFromNavigation = v1CaseIdFromQuery ?? v1CaseIdFromState;
  const arrangementIdFromQuery = searchParams.get('arrangementId') ?? undefined;
  const arrangementIdFromState = stringFromLocationState(
    location.state,
    'arrangementId'
  );
  const arrangementIdFromNavigation =
    arrangementIdFromQuery ?? arrangementIdFromState;
  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();

  const openV1Cases: V1Case[] = useMemo(() => {
    return family?.partneringFamilyInfo?.openV1Case !== undefined
      ? [family.partneringFamilyInfo.openV1Case]
      : [];
  }, [family?.partneringFamilyInfo?.openV1Case]);

  const closedV1Cases: V1Case[] = useMemo(() => {
    return family?.partneringFamilyInfo?.closedV1Cases === undefined
      ? []
      : [...family.partneringFamilyInfo.closedV1Cases!].sort(
          (r1, r2) =>
            (r2.closedAtUtc?.getTime() ?? 0) - (r1.closedAtUtc?.getTime() ?? 0)
        );
  }, [family?.partneringFamilyInfo?.closedV1Cases]);

  const allV1Cases: V1Case[] = useMemo(() => {
    return [...openV1Cases, ...closedV1Cases];
  }, [openV1Cases, closedV1Cases]);
  const [selectedTab, setSelectedTab] = useState<FamilyScreenTabValue>(
    arrangementIdFromNavigation ? 'arrangementsOrAssignments' : 'overview'
  );
  const [arrangementIdToScrollTo, setArrangementIdToScrollTo] = useState(
    arrangementIdFromNavigation
  );
  const firstV1CaseId = allV1Cases.length > 0 ? allV1Cases[0].id : undefined;
  const [selectedV1CaseId, setSelectedV1CaseId] = useState<string | undefined>(
    v1CaseIdFromNavigation || firstV1CaseId
  );
  const [selectedArrangementRowId, setSelectedArrangementRowId] = useState<
    string | null
  >(null);
  const previousArrangementIdFromNavigationRef = useRef<string | undefined>(
    undefined
  );
  const caseViewModel = useFamilyCaseViewModel({
    allV1Cases,
    family,
    familyLabel: (arrangementFamilyId) => {
      const matchedFamily = familyLookup(arrangementFamilyId);
      const primaryContactPerson = matchedFamily?.family?.adults?.find(
        (adult) =>
          adult.item1?.id === matchedFamily.family?.primaryFamilyContactPersonId
      )?.item1;

      return primaryContactPerson
        ? `${personNameString(primaryContactPerson)} Family`
        : 'Family';
    },
    familyReferrals,
    personLabel: (personFamilyId, personId) =>
      personNameString(personLookup(personFamilyId, personId)),
    policy,
    selectedArrangementRowId,
    selectedV1CaseId,
  });
  const hasOpenV1Case = openV1Cases.length > 0;
  const latestClosedV1Case = closedV1Cases[0];

  useEffect(() => {
    if (
      v1CaseIdFromNavigation &&
      allV1Cases.some((ref) => ref.id === v1CaseIdFromNavigation)
    ) {
      setSelectedV1CaseId(v1CaseIdFromNavigation);
    }
  }, [v1CaseIdFromNavigation, allV1Cases]);

  useEffect(() => {
    if (!arrangementIdFromNavigation) return;

    setSelectedTab('arrangementsOrAssignments');
    setArrangementIdToScrollTo(arrangementIdFromNavigation);
  }, [arrangementIdFromNavigation]);

  useEffect(() => {
    if (!arrangementIdFromNavigation || v1CaseIdFromNavigation) return;

    const v1CaseForArrangement = allV1Cases.find((v1Case) =>
      v1Case.arrangements?.some(
        (arrangement) => arrangement.id === arrangementIdFromNavigation
      )
    );

    if (v1CaseForArrangement?.id) {
      setSelectedV1CaseId(v1CaseForArrangement.id);
    }
  }, [arrangementIdFromNavigation, allV1Cases, v1CaseIdFromNavigation]);

  useEffect(() => {
    const previousArrangementIdFromNavigation =
      previousArrangementIdFromNavigationRef.current;
    previousArrangementIdFromNavigationRef.current = arrangementIdFromNavigation;

    if (!arrangementIdFromNavigation) {
      if (previousArrangementIdFromNavigation) {
        setSelectedArrangementRowId(null);
      }

      return;
    }

    const arrangementExistsInSelectedCase =
      caseViewModel.selectedCaseArrangementRows.some(
        (row) => row.id === arrangementIdFromNavigation
      );

    if (!arrangementExistsInSelectedCase) {
      setSelectedArrangementRowId(null);
      return;
    }

    setSelectedArrangementRowId((current) =>
      current === arrangementIdFromNavigation
        ? current
        : arrangementIdFromNavigation
    );
  }, [arrangementIdFromNavigation, caseViewModel.selectedCaseArrangementRows]);

  useEffect(() => {
    if (!caseViewModel.selectedV1Case) {
      posthog.capture('auto selected first v1Case');

      if (firstV1CaseId) {
        setSelectedV1CaseId(firstV1CaseId);
      }
    }
  }, [firstV1CaseId, caseViewModel.selectedV1Case]);

  useSyncV1CaseIdInURL({
    familyId,
    v1CaseIdFromQuery,
    selectedV1CaseId,
  });

  return {
    ...caseViewModel,
    allV1Cases,
    arrangementIdToScrollTo,
    hasOpenV1Case,
    latestClosedV1Case,
    selectedArrangementRowId,
    selectedTab,
    selectedV1CaseId,
    setArrangementIdToScrollTo,
    setSelectedArrangementRowId,
    setSelectedTab,
    setSelectedV1CaseId,
  };
}
