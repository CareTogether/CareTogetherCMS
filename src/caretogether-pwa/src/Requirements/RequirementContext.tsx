import { FamilyVolunteerAssignment, IndividualVolunteerAssignment } from "../../GeneratedClient";

export interface ReferralContext {
  kind: "Referral";
  partneringFamilyId: string;
  referralId: string;
}

export interface ArrangementContext {
  kind: "Arrangement";
  partneringFamilyId: string;
  referralId: string;
  arrangementId: string;
}

export interface FamilyVolunteerAssignmentContext {
  kind: "Family Volunteer Assignment";
  partneringFamilyId: string;
  referralId: string;
  arrangementId: string;
  assignment: FamilyVolunteerAssignment;
}

export interface IndividualVolunteerAssignmentContext {
  kind: "Individual Volunteer Assignment";
  partneringFamilyId: string;
  referralId: string;
  arrangementId: string;
  assignment: IndividualVolunteerAssignment;
}

export interface VolunteerFamilyContext {
  kind: "Volunteer Family";
  volunteerFamilyId: string;
}

export interface IndividualVolunteerContext {
  kind: "Individual Volunteer";
  volunteerFamilyId: string;
  personId: string;
}

export type RequirementContext =
  ReferralContext |
  ArrangementContext |
  FamilyVolunteerAssignmentContext |
  IndividualVolunteerAssignmentContext |
  VolunteerFamilyContext |
  IndividualVolunteerContext;
