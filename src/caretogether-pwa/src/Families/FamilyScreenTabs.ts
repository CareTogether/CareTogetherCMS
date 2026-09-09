import type { ResponsiveScreenTab } from '../Generic/ResponsiveScreenTabs';

export type FamilyScreenTabValue =
  | 'overview'
  | 'caseHistory'
  | 'approvals'
  | 'arrangementsOrAssignments'
  | 'documents'
  | 'timelineAndNotes';

export type FamilyScreenTab = ResponsiveScreenTab<FamilyScreenTabValue> & {
  label: string;
};
