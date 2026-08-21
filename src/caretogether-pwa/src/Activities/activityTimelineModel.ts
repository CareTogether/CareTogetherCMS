import {
  Activity,
  ArrangementRequirementCompleted,
  ChildLocationChanged,
  Note,
  ReferralOpened as V1CaseOpened,
  ReferralRequirementCompleted as V1CaseRequirementCompleted,
  V1Referral,
} from '../GeneratedClient';

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
