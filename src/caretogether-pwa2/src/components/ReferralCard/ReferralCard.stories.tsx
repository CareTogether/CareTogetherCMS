import type { Meta, StoryObj } from '@storybook/react';
import { ReferralCard } from './ReferralCard';
import { mockReferralData } from './mockData';
import { ReferralStatus, FamilyType } from '../chips/chipTypes';

const meta = {
  title: 'Components/Display/ReferralCard',
  component: ReferralCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ReferralCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default referral card with all information populated
 */
export const Default: Story = {
  args: {
    data: mockReferralData,
    onAssignClient: () => console.log('Assign Client clicked'),
    onNewNote: () => console.log('New Note clicked'),
    onNavigatePrevious: () => console.log('Navigate Previous clicked'),
    onNavigateNext: () => console.log('Navigate Next clicked'),
  },
};

/**
 * Referral header with pending status
 */
export const PendingStatus: Story = {
  args: {
    data: {
      ...mockReferralData,
      status: ReferralStatus.Pending,
      comments: 'Family needs immediate housing assistance. Two children, ages 5 and 8.',
    },
    onAssignClient: () => console.log('Assign Client clicked'),
    onNewNote: () => console.log('New Note clicked'),
  },
};

/**
 * Referral header with completed status
 */
export const CompletedStatus: Story = {
  args: {
    data: {
      ...mockReferralData,
      status: ReferralStatus.Completed,
      familyType: FamilyType.BehavioralNeeds,
      arrangements: [
        {
          id: 'arr-1',
          arrangementType: 'Mentoring',
          phase: 3,
          requestedAtUtc: new Date('2025-06-06T00:00:00Z'),
        },
        {
          id: 'arr-2',
          arrangementType: 'Financial Support',
          phase: 3,
          requestedAtUtc: new Date('2025-06-10T00:00:00Z'),
        },
      ],
      comments:
        'Case successfully completed. Family has been placed in stable housing and is connected with community resources.',
    },
    onAssignClient: () => console.log('Assign Client clicked'),
    onNewNote: () => console.log('New Note clicked'),
  },
};

/**
 * Referral header with minimal information
 */
export const MinimalInfo: Story = {
  args: {
    data: {
      id: 'v1case-min',
      openedAtUtc: new Date('2026-01-10T00:00:00Z'),
      familyName: 'Smith Family',
      primaryContact: {
        firstName: 'John',
        lastName: 'Smith',
      },
      status: ReferralStatus.Pending,
      familyType: FamilyType.PartneringFamily,
      arrangements: [],
      comments: 'Initial intake in progress.',
    },
    onAssignClient: () => console.log('Assign Client clicked'),
    onNewNote: () => console.log('New Note clicked'),
  },
};

/**
 * Referral header with long description to show More/Less functionality
 */
export const LongDescription: Story = {
  args: {
    data: {
      ...mockReferralData,
      comments:
        'This is a very long description that exceeds the 150 character limit and will be truncated. The family is being referred for comprehensive support including housing assistance, childcare support, financial counseling, and connection to community resources. They have been displaced due to a house fire and need immediate temporary housing while insurance processes their claim. The family includes two adults and three children ages 3, 7, and 12. All children are enrolled in local schools and need transportation assistance during the transition period.',
    },
    onAssignClient: () => console.log('Assign Client clicked'),
    onNewNote: () => console.log('New Note clicked'),
  },
};

/**
 * Referral header for hosting arrangement
 */
export const HostingArrangement: Story = {
  args: {
    data: {
      id: 'v1case-hosting',
      openedAtUtc: new Date('2025-12-15T00:00:00Z'),
      familyName: 'Johnson Family',
      primaryContact: {
        firstName: 'Emily',
        lastName: 'Johnson',
        phone: '555-123-4567',
        email: 'johnson.family@email.com',
      },
      status: ReferralStatus.Hosting,
      familyType: FamilyType.SupportLineVolunteer,
      arrangements: [
        {
          id: 'arr-1',
          arrangementType: 'Hosting',
          phase: 2,
          requestedAtUtc: new Date('2025-12-15T00:00:00Z'),
        },
        {
          id: 'arr-2',
          arrangementType: 'Emergency Placement',
          phase: 1,
          requestedAtUtc: new Date('2025-12-15T00:00:00Z'),
        },
      ],
      source: 'Child Services',
      comments:
        'Emergency foster care placement needed for two siblings, ages 6 and 10. Looking for experienced host family with capacity for school-age children.',
    },
    onAssignClient: () => console.log('Assign Client clicked'),
    onNewNote: () => console.log('New Note clicked'),
  },
};
