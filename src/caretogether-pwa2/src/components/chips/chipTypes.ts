// Family member types
export const FamilyMemberType = {
  Mother: 'Mother',
  Father: 'Father',
  Daughter: 'Daughter',
  Son: 'Son',
} as const;

export type FamilyMemberType = (typeof FamilyMemberType)[keyof typeof FamilyMemberType];

// Arrangement types
export const ArrangementType = {
  Hosting: 'Hosting',
  Friending: 'Friending',
  Mentoring: 'Mentoring',
} as const;

export type ArrangementType = (typeof ArrangementType)[keyof typeof ArrangementType];

// Family status types
export const FamilyStatus = {
  Completed: 'Completed',
  Warning: 'Warning',
  Incomplete: 'Incomplete',
} as const;

export type FamilyStatus = (typeof FamilyStatus)[keyof typeof FamilyStatus];

// Family types (Partnering Family, Behavioral needs, etc.)
export const FamilyType = {
  PartneringFamily: 'Partnering Family',
  BehavioralNeeds: 'Behavioral needs',
  SupportLineVolunteer: 'Support Line Volunteer',
  StaffFamily: 'Staff family',
} as const;

export type FamilyType = (typeof FamilyType)[keyof typeof FamilyType];

// Location status types
export const LocationStatus = {
  LocationSpecified: 'Location Specified',
  Family: 'Family',
  LocationUnspecified: 'Location Unspecified',
} as const;

export type LocationStatus = (typeof LocationStatus)[keyof typeof LocationStatus];

// New referral status types
export const ReferralStatus = {
  Pending: 'Pending',
  InProgress: 'In Progress',
  Completed: 'Completed',
  Hosting: 'Hosting',
} as const;

export type ReferralStatus = (typeof ReferralStatus)[keyof typeof ReferralStatus];

// Project status types
export const ProjectStatus = {
  CompletingIntake: 'Completing Intake',
  IntakeInProgress: 'Intake In Progress',
  CompletedIntake: 'Completed Intake',
  Optional: 'Optional',
  Exempted: 'Exempted',
  Completed: 'Completed',
  InProgress: 'In Progress',
  DaysRemaining: 'Days Remaining',
  Incomplete: 'Incomplete',
} as const;

export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];
