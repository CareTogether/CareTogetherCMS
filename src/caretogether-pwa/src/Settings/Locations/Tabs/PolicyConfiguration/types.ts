import {
  ChildInvolvement,
  CustomFieldType,
  DocumentLinkRequirement,
  FunctionRequirement,
  NoteEntryRequirement,
  Person,
} from '../../../../GeneratedClient';

export type ActionDefinitionDraft = {
  actionName: string;
  documentLink: DocumentLinkRequirement;
  noteEntry: NoteEntryRequirement;
  instructions: string;
  infoLink: string;
  validityEnabled: boolean;
  validityAmount: string;
  validityUnit: ValidityUnit;
  canView: string;
  canEdit: string;
  alternateNames: string[];
};

export type ValidityUnit = 'days' | 'months' | 'years';

export type CustomFieldDraft = {
  name: string;
  type: CustomFieldType;
  validationEnabled: boolean;
  validValues: string[];
};

export type RequirementDraft = {
  actionName: string;
  isRequired: boolean;
};

export type MonitoringRequirementDraft = RequirementDraft & {
  delayEnabled: boolean;
  delayAmount: string;
  delayUnit: ValidityUnit;
};

export type FunctionAssignmentPolicyDraft = {
  assignmentRole: string;
  eligibleLocationRoles: string[];
  eligibleIndividualVolunteerRoles: string[];
  eligibleVolunteerFamilyRoles: string[];
  eligiblePeople: string[];
};

export type ArrangementFunctionDraft = {
  functionName: string;
  requirement: FunctionRequirement;
  eligibleIndividualVolunteerRoles: string[];
  eligibleVolunteerFamilyRoles: string[];
  eligiblePeople: string[];
};

export type ArrangementPolicyDraft = {
  arrangementType: string;
  childInvolvement: ChildInvolvement;
  superseded: boolean;
  supersededAtUtc: string;
};

export type VolunteerRolePolicyVersionDraft = {
  roleName: string;
  version: string;
  superseded: boolean;
  supersededAtUtc: string;
  requirements: string;
};

export type NamedPolicyReference = {
  area: string;
  owner: string;
};

export type PersonOption = {
  id: string;
  label: string;
  person: Person;
};

