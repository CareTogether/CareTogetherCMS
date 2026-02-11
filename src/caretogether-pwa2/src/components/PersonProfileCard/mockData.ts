import { ProjectStatus } from '../chips/chipTypes';
import type { PersonProfileData } from './PersonProfileCard';

// Mock data matching actual Person API structure
export const mockPersonProfileData: PersonProfileData = {
  id: 'person-123',
  active: true,
  firstName: 'Lewis',
  lastName: 'Schroeder',
  gender: 0, // Male
  age: { dateOfBirth: new Date('1983-05-15'), type: 'DateOfBirth' },
  ethnicity: 'Caucasian',
  addresses: [
    {
      id: 'addr-1',
      line1: '123 Main St. Apt A',
      city: 'Charleston',
      state: 'NC',
      postalCode: '28105',
    },
  ],
  currentAddressId: 'addr-1',
  phoneNumbers: [
    {
      id: 'phone-1',
      number: '555-893-4282',
      type: 0, // Mobile
    },
  ],
  preferredPhoneNumberId: 'phone-1',
  emailAddresses: [
    {
      id: 'email-1',
      address: 'lew.schroeder@gmail.com',
      type: 0, // Personal
    },
  ],
  preferredEmailAddressId: 'email-1',
  notes: 'Comments about this arrangement',
  completionStatus: ProjectStatus.CompletingIntake,
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
  ],
};
