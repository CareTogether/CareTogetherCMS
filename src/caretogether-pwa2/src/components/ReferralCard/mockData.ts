import { ReferralStatus, FamilyType } from '../chips/chipTypes';
import type { ReferralData } from './ReferralCard';

// Mock data matching actual V1Case API structure
export const mockReferralData: ReferralData = {
  id: 'v1case-123',
  openedAtUtc: new Date('2025-06-06T00:00:00Z'),
  familyName: 'Johnson Family',
  primaryContact: {
    firstName: 'Sarah',
    lastName: 'Johnson',
    phone: '608-705-9341',
    email: 'sarah.johnson@email.com',
  },
  status: ReferralStatus.InProgress,
  familyType: FamilyType.PartneringFamily,
  arrangements: [
    {
      id: 'arr-1',
      arrangementType: 'Hosting',
      phase: 2, // Started
      requestedAtUtc: new Date('2025-06-06T00:00:00Z'),
    },
  ],
  source: 'Child Services',
  comments:
    'Family is being referred to hosting program for emergency placement. Key points include brief summary of context, relevant background, or goals. Two children ages 6 and 10 need immediate placement.',
};
