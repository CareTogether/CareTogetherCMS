import type { Meta, StoryObj } from '@storybook/react';
import { PersonProfileCard } from './PersonProfileCard';
import { mockPersonProfileData } from './mockData';
import { ProjectStatus } from '../chips/chipTypes';

const meta = {
  title: 'Components/Display/PersonProfileCard',
  component: PersonProfileCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PersonProfileCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default person profile card with all information populated
 */
export const Default: Story = {
  args: {
    data: mockPersonProfileData,
    onMoreClick: () => console.log('More menu clicked'),
    onViewSchedule: () => console.log('View Schedule clicked'),
  },
};

/**
 * Person profile with completed status
 */
export const CompletedStatus: Story = {
  args: {
    data: {
      ...mockPersonProfileData,
      completionStatus: ProjectStatus.Completed,
    },
    onMoreClick: () => console.log('More menu clicked'),
    onViewSchedule: () => console.log('View Schedule clicked'),
  },
};

/**
 * Person profile in progress
 */
export const InProgressStatus: Story = {
  args: {
    data: {
      ...mockPersonProfileData,
      id: 'person-maria',
      firstName: 'Maria',
      lastName: 'Garcia',
      age: { dateOfBirth: new Date('1989-06-15'), type: 'DateOfBirth' },
      ethnicity: 'Hispanic',
      addresses: [
        {
          id: 'addr-1',
          line1: '456 Oak Ave',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
        },
      ],
      currentAddressId: 'addr-1',
      phoneNumbers: [
        {
          id: 'phone-1',
          number: '512-555-0123',
          type: 0,
        },
      ],
      preferredPhoneNumberId: 'phone-1',
      emailAddresses: [
        {
          id: 'email-1',
          address: 'maria.garcia@email.com',
          type: 0,
        },
      ],
      preferredEmailAddressId: 'email-1',
      completionStatus: ProjectStatus.InProgress,
      volunteerAssignments: [
        {
          id: 'assign-1',
          arrangementType: 'Tutoring services',
          arrangementId: 'arr-1',
          color: '#4CAF50',
        },
      ],
    },
    onMoreClick: () => console.log('More menu clicked'),
    onViewSchedule: () => console.log('View Schedule clicked'),
  },
};

/**
 * Person profile with incomplete status
 */
export const IncompleteStatus: Story = {
  args: {
    data: {
      id: 'person-david',
      active: true,
      firstName: 'David',
      lastName: 'Chen',
      gender: 0,
      age: { dateOfBirth: new Date('1996-03-22'), type: 'DateOfBirth' },
      ethnicity: 'Asian',
      addresses: [
        {
          id: 'addr-1',
          line1: '789 Elm St',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94102',
        },
      ],
      currentAddressId: 'addr-1',
      phoneNumbers: [
        {
          id: 'phone-1',
          number: '415-555-9876',
          type: 0,
        },
      ],
      preferredPhoneNumberId: 'phone-1',
      emailAddresses: [
        {
          id: 'email-1',
          address: 'david.chen@email.com',
          type: 0,
        },
      ],
      preferredEmailAddressId: 'email-1',
      completionStatus: ProjectStatus.Incomplete,
      volunteerAssignments: [
        {
          id: 'assign-1',
          arrangementType: 'Home visits',
          arrangementId: 'arr-1',
          color: '#FF9800',
        },
        {
          id: 'assign-2',
          arrangementType: 'Transportation assistance',
          arrangementId: 'arr-2',
          color: '#00BCD4',
        },
      ],
    },
    onMoreClick: () => console.log('More menu clicked'),
    onViewSchedule: () => console.log('View Schedule clicked'),
  },
};

/**
 * Person profile without activities
 */
export const NoActivities: Story = {
  args: {
    data: {
      id: 'person-sarah',
      active: true,
      firstName: 'Sarah',
      lastName: 'Williams',
      gender: 1,
      age: { dateOfBirth: new Date('1972-08-10'), type: 'DateOfBirth' },
      ethnicity: 'Caucasian',
      addresses: [
        {
          id: 'addr-1',
          line1: '321 Pine Rd',
          city: 'Denver',
          state: 'CO',
          postalCode: '80202',
        },
      ],
      currentAddressId: 'addr-1',
      phoneNumbers: [
        {
          id: 'phone-1',
          number: '303-555-4321',
          type: 0,
        },
      ],
      preferredPhoneNumberId: 'phone-1',
      emailAddresses: [
        {
          id: 'email-1',
          address: 'sarah.w@email.com',
          type: 0,
        },
      ],
      preferredEmailAddressId: 'email-1',
      notes: 'New volunteer, awaiting first assignment',
      completionStatus: ProjectStatus.CompletedIntake,
      volunteerAssignments: [],
    },
    onMoreClick: () => console.log('More menu clicked'),
  },
};

/**
 * Person profile with minimal information
 */
export const MinimalInfo: Story = {
  args: {
    data: {
      id: 'person-john',
      active: true,
      firstName: 'John',
      lastName: 'Doe',
      gender: 0,
      age: { dateOfBirth: new Date('1979-01-15'), type: 'DateOfBirth' },
      addresses: [],
      phoneNumbers: [],
      emailAddresses: [],
      completionStatus: ProjectStatus.IntakeInProgress,
      volunteerAssignments: [],
    },
    onMoreClick: () => console.log('More menu clicked'),
  },
};

/**
 * Person profile with multiple activities
 */
export const ManyActivities: Story = {
  args: {
    data: {
      ...mockPersonProfileData,
      id: 'person-patricia',
      firstName: 'Patricia',
      lastName: 'Brown',
      age: { dateOfBirth: new Date('1985-11-20'), type: 'DateOfBirth' },
      ethnicity: 'African American',
      volunteerAssignments: [
        {
          id: 'assign-1',
          arrangementType: 'Ride share for Elena',
          arrangementId: 'arr-1',
          color: '#9C27B0',
        },
        {
          id: 'assign-2',
          arrangementType: 'Babysitting Isabel and Diego',
          arrangementId: 'arr-2',
          color: '#2196F3',
        },
        {
          id: 'assign-3',
          arrangementType: 'Meal preparation',
          arrangementId: 'arr-3',
          color: '#FF5722',
        },
        {
          id: 'assign-4',
          arrangementType: 'After-school tutoring',
          arrangementId: 'arr-4',
          color: '#4CAF50',
        },
      ],
    },
    onMoreClick: () => console.log('More menu clicked'),
    onViewSchedule: () => console.log('View Schedule clicked'),
  },
};

/**
 * Person profile with exempted status
 */
export const ExemptedStatus: Story = {
  args: {
    data: {
      id: 'person-michael',
      active: true,
      firstName: 'Michael',
      lastName: 'Thompson',
      gender: 0,
      age: { dateOfBirth: new Date('1963-04-05'), type: 'DateOfBirth' },
      addresses: [
        {
          id: 'addr-1',
          line1: '555 Maple Dr',
          city: 'Boston',
          state: 'MA',
          postalCode: '02101',
        },
      ],
      currentAddressId: 'addr-1',
      phoneNumbers: [
        {
          id: 'phone-1',
          number: '617-555-7890',
          type: 0,
        },
      ],
      preferredPhoneNumberId: 'phone-1',
      emailAddresses: [
        {
          id: 'email-1',
          address: 'm.thompson@email.com',
          type: 0,
        },
      ],
      preferredEmailAddressId: 'email-1',
      notes: 'Veteran volunteer - expedited approval',
      completionStatus: ProjectStatus.Exempted,
      volunteerAssignments: [
        {
          id: 'assign-1',
          arrangementType: 'Mentorship program',
          arrangementId: 'arr-1',
          color: '#795548',
        },
      ],
    },
    onMoreClick: () => console.log('More menu clicked'),
    onViewSchedule: () => console.log('View Schedule clicked'),
  },
};
