
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

export interface VolunteerFamilyContext {
  kind: "Volunteer Family";
  volunteerFamilyId: string;
}

export interface IndividualVolunteerContext {
  kind: "Individual Volunteer";
  volunteerFamilyId: string;
  personId: string;
}

export type RequirementContext = ReferralContext | ArrangementContext | VolunteerFamilyContext | IndividualVolunteerContext;
