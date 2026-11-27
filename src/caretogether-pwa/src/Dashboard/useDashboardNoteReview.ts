import { useMemo } from 'react';
import { useAccountInfo } from '../Authentication/Auth';
import { useLocationConfiguration } from '../Model/ConfigurationModel';
import {
  useCurrentLocation,
  useVisibleFamilies,
  useVisibleReferrals,
} from '../Model/Data';
import { useFamilyLookup } from '../Model/DirectoryModel';
import { buildDashboardNoteReview } from './dashboardNoteReview';

import { disclosedFamilyName } from './dashboardFamilyName';

export function useDashboardNoteReview() {
  const families = useVisibleFamilies();
  const referrals = useVisibleReferrals();
  const familyLookup = useFamilyLookup();
  const userId = useAccountInfo()?.userId;
  const roles = useCurrentLocation()?.roles;
  const accessLevels = useLocationConfiguration()?.accessLevels;
  return useMemo(
    () =>
      buildDashboardNoteReview(
        families,
        referrals,
        (id) => disclosedFamilyName(familyLookup(id)),
        { userId, roles, accessLevels }
      ),
    [families, referrals, familyLookup, userId, roles, accessLevels]
  );
}

export type ReviewNote = ReturnType<typeof useDashboardNoteReview>[number];

export function noteKey(item: ReviewNote) {
  return JSON.stringify([item.source, item.recordId, item.id]);
}
