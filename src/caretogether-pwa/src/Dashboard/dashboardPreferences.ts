import type { LocationScope } from '../Model/LocationScope';
import type { NoteReviewSource } from './dashboardNoteReview';

export const requirementWindowDays = [7, 14, 30, 60, 90] as const;

export type RequirementWindowDays = (typeof requirementWindowDays)[number];

export type DashboardPreferences = {
  upcomingDays: RequirementWindowDays;
  pastDueDays: RequirementWindowDays | 'all';
  expirationDays: RequirementWindowDays;
  noteReviewSource: NoteReviewSource | 'all';
};

export const defaultDashboardPreferences: DashboardPreferences = {
  upcomingDays: 30,
  pastDueDays: 'all',
  expirationDays: 30,
  noteReviewSource: 'all',
};

export function dashboardPreferencesKey(
  userId: string | undefined,
  scope: LocationScope | null
) {
  if (!userId || !scope?.organizationId || !scope.locationId) return null;
  return `caretogether:dashboardPreferences:v1:${JSON.stringify([
    userId,
    scope.organizationId,
    scope.locationId,
  ])}`;
}

export function readDashboardPreferences(
  key: string | null,
  storage?: Pick<Storage, 'getItem'>
): DashboardPreferences {
  if (!key) return defaultDashboardPreferences;

  try {
    const stored: unknown = JSON.parse(
      (storage ?? window.localStorage).getItem(key) ?? 'null'
    );
    if (!stored || typeof stored !== 'object')
      return defaultDashboardPreferences;

    return {
      upcomingDays:
        requirementWindowDays.find(
          (days) => 'upcomingDays' in stored && stored.upcomingDays === days
        ) ?? defaultDashboardPreferences.upcomingDays,
      pastDueDays:
        requirementWindowDays.find(
          (days) => 'pastDueDays' in stored && stored.pastDueDays === days
        ) ?? defaultDashboardPreferences.pastDueDays,
      expirationDays:
        requirementWindowDays.find(
          (days) => 'expirationDays' in stored && stored.expirationDays === days
        ) ?? defaultDashboardPreferences.expirationDays,
      noteReviewSource:
        'noteReviewSource' in stored &&
        (stored.noteReviewSource === 'family' ||
          stored.noteReviewSource === 'referral')
          ? stored.noteReviewSource
          : defaultDashboardPreferences.noteReviewSource,
    };
  } catch {
    return defaultDashboardPreferences;
  }
}

export function writeDashboardPreferences(
  key: string | null,
  preferences: DashboardPreferences,
  storage?: Pick<Storage, 'setItem'>
) {
  if (!key) return;

  try {
    (storage ?? window.localStorage).setItem(key, JSON.stringify(preferences));
  } catch {
    return;
  }
}
