export interface ReferralRowModel {
  id: string;
  title: string;
  status: 'OPEN' | 'ACCEPTED' | 'CLOSED';
  openedAtUtc?: Date;
  acceptedAtUtc?: Date;
  closedAtUtc?: Date;
  clientFamilyName: string | null;
  county: string | null;
  comments?: string;
  assignmentNamesByRole: Record<string, string>;
}

export type ReferralCustomFieldValue = string | boolean | string[] | null;

export type ReferralAssignmentRoleV2 = {
  role: string;
  options: { value: string; label: string }[];
};

export type ReferralBrowserRowV2 = Omit<
  ReferralRowModel,
  'openedAtUtc' | 'acceptedAtUtc' | 'closedAtUtc' | 'comments'
> & {
  referralCount: 1;
  openedAtUtc: Date | null;
  acceptedAtUtc: Date | null;
  closedAtUtc: Date | null;
  comments: string;
  searchableText: string;
  assignmentPersonIdsByRole: Record<string, string[]>;
  customFieldValues: Record<string, ReferralCustomFieldValue>;
};
