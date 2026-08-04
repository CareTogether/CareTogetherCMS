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
