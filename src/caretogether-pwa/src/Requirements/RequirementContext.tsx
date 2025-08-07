import {
  FamilyVolunteerAssignment,
  IndividualVolunteerAssignment,
} from '../GeneratedClient';

export interface V1CaseContext {
  kind: 'V1Case';
  partneringFamilyId: string;
  v1CaseId: string;
}

export interface ArrangementContext {
  kind: 'Arrangement';
  partneringFamilyId: string;
  v1CaseId: string;
  arrangementId: string;
}

export interface FamilyVolunteerAssignmentContext {
  kind: 'Family Volunteer Assignment';
  partneringFamilyId: string;
  v1CaseId: string;
  arrangementId: string;
  assignment: FamilyVolunteerAssignment;
}

export interface IndividualVolunteerAssignmentContext {
  kind: 'Individual Volunteer Assignment';
  partneringFamilyId: string;
  v1CaseId: string;
  arrangementId: string;
  assignment: IndividualVolunteerAssignment;
}

export interface VolunteerFamilyContext {
  kind: 'Volunteer Family';
  volunteerFamilyId: string;
}

export interface IndividualVolunteerContext {
  kind: 'Individual Volunteer';
  volunteerFamilyId: string;
  personId: string;
}

export type RequirementContext =
  | V1CaseContext
  | ArrangementContext
  | FamilyVolunteerAssignmentContext
  | IndividualVolunteerAssignmentContext
  | VolunteerFamilyContext
  | IndividualVolunteerContext;
