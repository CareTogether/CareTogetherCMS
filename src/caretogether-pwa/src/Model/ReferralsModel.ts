import { selector, useRecoilCallback } from "recoil";
import { authenticatingFetch } from "../Authentication/AuthenticatedHttp";
import { ReferralCommand, ReferralsClient, ArrangementsCommand, ActionRequirement, CompleteReferralRequirement, CreateArrangement, CompleteArrangementRequirement, StartArrangements, EndArrangements, AssignVolunteerFamily, AssignIndividualVolunteer, ReferralCloseReason, CloseReferral, CreateReferral, TrackChildLocationChange, ChildLocationPlan, UpdateCustomReferralField, CustomField, ExemptReferralRequirement, UnexemptReferralRequirement, ExemptArrangementRequirement, UnexemptArrangementRequirement, MissingArrangementRequirement, ExemptedRequirementInfo, MarkReferralRequirementIncomplete, CompletedRequirementInfo, MarkArrangementRequirementIncomplete, CancelArrangementsSetup, UpdateReferralComments, UnassignVolunteerFamily, UnassignIndividualVolunteer, CompleteVolunteerFamilyAssignmentRequirement, CompleteIndividualVolunteerAssignmentRequirement, FamilyVolunteerAssignment, IndividualVolunteerAssignment, ExemptIndividualVolunteerAssignmentRequirement, ExemptVolunteerFamilyAssignmentRequirement, MarkIndividualVolunteerAssignmentRequirementIncomplete, MarkVolunteerFamilyAssignmentRequirementIncomplete, UnexemptIndividualVolunteerAssignmentRequirement, UnexemptVolunteerFamilyAssignmentRequirement, UpdateArrangementComments, ReopenArrangements, EditArrangementStartTime, DeleteChildLocationChange, PlanArrangementStart, PlanArrangementEnd, PlanChildLocationChange, DeletePlannedChildLocationChange } from "../GeneratedClient";
import { visibleFamiliesData } from "./DirectoryModel";
import { currentOrganizationState, currentLocationState } from "./SessionModel";

export const partneringFamiliesData = selector({
  key: 'partneringFamiliesData',
  get: ({get}) => {
    const visibleFamilies = get(visibleFamiliesData);
    return visibleFamilies.filter(f => f.partneringFamilyInfo);
  }});

function useReferralCommandCallbackWithLocation<T extends unknown[]>(
  callback: (organizationId: string, locationId: string, partneringFamilyId: string, ...args: T) => Promise<ReferralCommand>) {
  return useRecoilCallback(({snapshot, set}) => {
    const asyncCallback = async (partneringFamilyId: string, ...args: T) => {
      const organizationId = await snapshot.getPromise(currentOrganizationState);
      const locationId = await snapshot.getPromise(currentLocationState);

      const command = await callback(organizationId, locationId, partneringFamilyId, ...args);

      const client = new ReferralsClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
      const updatedFamily = await client.submitReferralCommand(organizationId, locationId, command);

      set(visibleFamiliesData, current => {
        return current.map(currentEntry => currentEntry.family?.id === partneringFamilyId
          ? updatedFamily
          : currentEntry);
      });
    };
    return asyncCallback;
  })
}

// function useReferralCommandCallback<T extends unknown[]>(
//   callback: (partneringFamilyId: string, ...args: T) => Promise<ReferralCommand>) {
//   return useReferralCommandCallbackWithLocation<T>(
//     (_organizationId, _locationId, partneringFamilyId, ...args) => callback(partneringFamilyId, ...args));
// }

function useArrangementsCommandCallbackWithLocation<T extends unknown[]>(
  callback: (organizationId: string, locationId: string, partneringFamilyId: string, referralId: string, ...args: T) => Promise<ArrangementsCommand>) {
  return useRecoilCallback(({snapshot, set}) => {
    const asyncCallback = async (partneringFamilyId: string, referralId: string, ...args: T) => {
      const organizationId = await snapshot.getPromise(currentOrganizationState);
      const locationId = await snapshot.getPromise(currentLocationState);

      const command = await callback(organizationId, locationId, partneringFamilyId, referralId, ...args);

      const client = new ReferralsClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
      const updatedFamily = await client.submitArrangementsCommand(organizationId, locationId, command);

      set(visibleFamiliesData, current => {
        return current.map(currentEntry => currentEntry.family?.id === partneringFamilyId
          ? updatedFamily
          : currentEntry);
      });
    };
    return asyncCallback;
  })
}

// function useArrangementCommandCallback<T extends unknown[]>(
//   callback: (partneringFamilyId: string, personId: string, ...args: T) => Promise<ArrangementCommand>) {
//   return useArrangementCommandCallbackWithLocation<T>(
//     (_organizationId, _locationId, partneringFamilyId, personId, ...args) => callback(partneringFamilyId, personId, ...args));
// }

export function useReferralsModel() {
  const completeReferralRequirement = useReferralCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, requirementName: string, requirement: ActionRequirement,
      completedAtLocal: Date, documentId: string | null, noteId: string | null) => {
      const command = new CompleteReferralRequirement({
        familyId: partneringFamilyId,
        referralId: referralId,
      });
      command.requirementName = requirementName;
      command.completedAtUtc = completedAtLocal;
      if (documentId != null)
        command.uploadedDocumentId = documentId;
      if (noteId != null)
        command.noteId = noteId;
      return command;
    });
  const markReferralRequirementIncomplete = useReferralCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, completedRequirement: CompletedRequirementInfo) => {
      const command = new MarkReferralRequirementIncomplete({
        familyId: partneringFamilyId,
        referralId: referralId
      });
      command.requirementName = completedRequirement.requirementName;
      command.completedRequirementId = completedRequirement.completedRequirementId;
      return command;
    });
  const exemptReferralRequirement = useReferralCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, requirementName: string,
      additionalComments: string, exemptionExpiresAtLocal: Date | null) => {
      const command = new ExemptReferralRequirement({
        familyId: partneringFamilyId,
        referralId: referralId,
      });
      command.requirementName = requirementName;
      command.additionalComments = additionalComments;
      command.exemptionExpiresAtUtc = exemptionExpiresAtLocal ?? undefined;
      return command;
    });
  const unexemptReferralRequirement = useReferralCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, exemptedRequirement: ExemptedRequirementInfo) => {
      const command = new UnexemptReferralRequirement({
        familyId: partneringFamilyId,
        referralId: referralId,
      });
      command.requirementName = exemptedRequirement.requirementName;
      return command;
    });
  const updateCustomReferralField = useReferralCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, customField: CustomField,
      value: boolean | string | null) => {
      const command = new UpdateCustomReferralField({
        familyId: partneringFamilyId,
        referralId: referralId,
      });
      command.customFieldName = customField.name;
      command.customFieldType = customField.type;
      command.value = value;
      return command;
    });
  const updateReferralComments = useReferralCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, comments: string | undefined) => {
      const command = new UpdateReferralComments({
        familyId: partneringFamilyId,
        referralId: referralId,
      });
      command.comments = comments;
      return command;
    });
  const completeArrangementRequirement = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementIds: string[],
      requirementName: string, requirement: ActionRequirement,
      completedAtLocal: Date, documentId: string | null, noteId: string | null) => {
      const command = new CompleteArrangementRequirement({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: arrangementIds
      });
      command.requirementName = requirementName;
      command.completedAtUtc = completedAtLocal;
      if (documentId != null)
        command.uploadedDocumentId = documentId;
      if (noteId != null)
        command.noteId = noteId;
      return command;
    });
  const markArrangementRequirementIncomplete = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      completedRequirement: CompletedRequirementInfo) => {
      const command = new MarkArrangementRequirementIncomplete({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId]
      });
      command.requirementName = completedRequirement.requirementName;
      command.completedRequirementId = completedRequirement.completedRequirementId;
      return command;
    });
  const exemptArrangementRequirement = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementIds: string[],
      requirement: MissingArrangementRequirement, exemptAll: Boolean,
      additionalComments: string, exemptionExpiresAtLocal: Date | null) => {
      const command = new ExemptArrangementRequirement({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: arrangementIds
      });
      command.requirementName = requirement.actionName;
      command.dueDate = exemptAll
        ? undefined
        : requirement.dueBy || requirement.pastDueSince;
      command.additionalComments = additionalComments;
      command.exemptionExpiresAtUtc = exemptionExpiresAtLocal ?? undefined;
      return command;
    });
  const unexemptArrangementRequirement = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      exemptedRequirement: ExemptedRequirementInfo) => {
      const command = new UnexemptArrangementRequirement({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId]
      });
      command.requirementName = exemptedRequirement.requirementName;
      command.dueDate = exemptedRequirement.dueDate;
      return command;
    });
    
  const completeVolunteerFamilyAssignmentRequirement = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementIds: string[],
      assignment: FamilyVolunteerAssignment,
      requirementName: string, requirement: ActionRequirement,
      completedAtLocal: Date, documentId: string | null, noteId: string | null) => {
      const command = new CompleteVolunteerFamilyAssignmentRequirement({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: arrangementIds
      });
      command.arrangementFunction = assignment.arrangementFunction;
      command.arrangementFunctionVariant = assignment.arrangementFunctionVariant;
      command.volunteerFamilyId = assignment.familyId;
      command.requirementName = requirementName;
      command.completedAtUtc = completedAtLocal;
      if (documentId != null)
        command.uploadedDocumentId = documentId;
      if (noteId != null)
        command.noteId = noteId;
      return command;
    });
  const markVolunteerFamilyAssignmentRequirementIncomplete = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      assignment: FamilyVolunteerAssignment,
      completedRequirement: CompletedRequirementInfo) => {
      const command = new MarkVolunteerFamilyAssignmentRequirementIncomplete({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId]
      });
      command.arrangementFunction = assignment.arrangementFunction;
      command.arrangementFunctionVariant = assignment.arrangementFunctionVariant;
      command.volunteerFamilyId = assignment.familyId;
      command.requirementName = completedRequirement.requirementName;
      command.completedRequirementId = completedRequirement.completedRequirementId;
      return command;
    });
  const exemptVolunteerFamilyAssignmentRequirement = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementIds: string[],
      assignment: FamilyVolunteerAssignment,
      requirement: MissingArrangementRequirement, exemptAll: Boolean,
      additionalComments: string, exemptionExpiresAtLocal: Date | null) => {
      const command = new ExemptVolunteerFamilyAssignmentRequirement({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: arrangementIds
      });
      command.arrangementFunction = assignment.arrangementFunction;
      command.arrangementFunctionVariant = assignment.arrangementFunctionVariant;
      command.volunteerFamilyId = assignment.familyId;
      command.requirementName = requirement.actionName;
      command.dueDate = exemptAll
        ? undefined
        : requirement.dueBy || requirement.pastDueSince;
      command.additionalComments = additionalComments;
      command.exemptionExpiresAtUtc = exemptionExpiresAtLocal ?? undefined;
      return command;
    });
  const unexemptVolunteerFamilyAssignmentRequirement = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      assignment: FamilyVolunteerAssignment,
      exemptedRequirement: ExemptedRequirementInfo) => {
      const command = new UnexemptVolunteerFamilyAssignmentRequirement({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId]
      });
      command.arrangementFunction = assignment.arrangementFunction;
      command.arrangementFunctionVariant = assignment.arrangementFunctionVariant;
      command.volunteerFamilyId = assignment.familyId;
      command.requirementName = exemptedRequirement.requirementName;
      command.dueDate = exemptedRequirement.dueDate;
      return command;
    });

  const completeIndividualVolunteerAssignmentRequirement = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementIds: string[],
      assignment: IndividualVolunteerAssignment,
      requirementName: string, requirement: ActionRequirement,
      completedAtLocal: Date, documentId: string | null, noteId: string | null) => {
      const command = new CompleteIndividualVolunteerAssignmentRequirement({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: arrangementIds
      });
      command.arrangementFunction = assignment.arrangementFunction;
      command.arrangementFunctionVariant = assignment.arrangementFunctionVariant;
      command.volunteerFamilyId = assignment.familyId;
      command.personId = assignment.personId;
      command.requirementName = requirementName;
      command.completedAtUtc = completedAtLocal;
      if (documentId != null)
        command.uploadedDocumentId = documentId;
      if (noteId != null)
        command.noteId = noteId;
      return command;
    });
  const markIndividualVolunteerAssignmentRequirementIncomplete = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      assignment: IndividualVolunteerAssignment,
      completedRequirement: CompletedRequirementInfo) => {
      const command = new MarkIndividualVolunteerAssignmentRequirementIncomplete({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId]
      });
      command.arrangementFunction = assignment.arrangementFunction;
      command.arrangementFunctionVariant = assignment.arrangementFunctionVariant;
      command.volunteerFamilyId = assignment.familyId;
      command.personId = assignment.personId;
      command.requirementName = completedRequirement.requirementName;
      command.completedRequirementId = completedRequirement.completedRequirementId;
      return command;
    });
  const exemptIndividualVolunteerAssignmentRequirement = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementIds: string[],
      assignment: IndividualVolunteerAssignment,
      requirement: MissingArrangementRequirement, exemptAll: Boolean,
      additionalComments: string, exemptionExpiresAtLocal: Date | null) => {
      const command = new ExemptIndividualVolunteerAssignmentRequirement({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: arrangementIds
      });
      command.arrangementFunction = assignment.arrangementFunction;
      command.arrangementFunctionVariant = assignment.arrangementFunctionVariant;
      command.volunteerFamilyId = assignment.familyId;
      command.personId = assignment.personId;
      command.requirementName = requirement.actionName;
      command.dueDate = exemptAll
        ? undefined
        : requirement.dueBy || requirement.pastDueSince;
      command.additionalComments = additionalComments;
      command.exemptionExpiresAtUtc = exemptionExpiresAtLocal ?? undefined;
      return command;
    });
  const unexemptIndividualVolunteerAssignmentRequirement = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      assignment: IndividualVolunteerAssignment,
      exemptedRequirement: ExemptedRequirementInfo) => {
      const command = new UnexemptIndividualVolunteerAssignmentRequirement({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId]
      });
      command.arrangementFunction = assignment.arrangementFunction;
      command.arrangementFunctionVariant = assignment.arrangementFunctionVariant;
      command.volunteerFamilyId = assignment.familyId;
      command.personId = assignment.personId;
      command.requirementName = exemptedRequirement.requirementName;
      command.dueDate = exemptedRequirement.dueDate;
      return command;
    });
    
  const createArrangement = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementType: string,
      requestedAtLocal: Date, partneringFamilyPersonId: string) => {
      const command = new CreateArrangement({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: []
      });
      command.arrangementType = arrangementType;
      command.requestedAtUtc = requestedAtLocal;
      command.partneringFamilyPersonId = partneringFamilyPersonId;
      return command;
    });
  const planArrangementStart = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      plannedStartLocal: Date | null) => {
      const command = new PlanArrangementStart({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId]
      });
      command.plannedStartUtc = plannedStartLocal || undefined;
      return command;
    });
  const startArrangement = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      startedAtLocal: Date) => {
      const command = new StartArrangements({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId]
      });
      command.startedAtUtc = startedAtLocal;
      return command;
    });
  const editArrangementStartTime = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      startedAtLocal: Date) => {
      const command = new EditArrangementStartTime({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId]
      });
      command.startedAtUtc = startedAtLocal;
      return command;
    });
  const planArrangementEnd = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      plannedEndLocal: Date | null) => {
      const command = new PlanArrangementEnd({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId]
      });
      command.plannedEndUtc = plannedEndLocal || undefined;
      return command;
    });
  const endArrangement = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      endedAtLocal: Date) => {
      const command = new EndArrangements({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId]
      });
      command.endedAtUtc = endedAtLocal;
      return command;
    });
  const reopenArrangement = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      noteId: string | null) => {
      const command = new ReopenArrangements({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId]
      });
      if (noteId != null)
        command.noteId = noteId;
      return command;
    });
  const cancelArrangement = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      cancelledAtLocal: Date) => {
      const command = new CancelArrangementsSetup({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId]
      });
      command.cancelledAtUtc = cancelledAtLocal;
      return command;
    });
  const assignVolunteerFamily = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      volunteerFamilyId: string, arrangementFunction: string, arrangementFunctionVariant?: string) => {
      const command = new AssignVolunteerFamily({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId]
      });
      command.volunteerFamilyId = volunteerFamilyId;
      command.arrangementFunction = arrangementFunction;
      command.arrangementFunctionVariant = arrangementFunctionVariant;
      return command;
    });
  const assignIndividualVolunteer = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      volunteerFamilyId: string, personId: string, arrangementFunction: string, arrangementFunctionVariant?: string) => {
      const command = new AssignIndividualVolunteer({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId]
      });
      command.volunteerFamilyId = volunteerFamilyId;
      command.personId = personId;
      command.arrangementFunction = arrangementFunction;
      command.arrangementFunctionVariant = arrangementFunctionVariant;
      return command;
    });
  const unassignVolunteerFamily = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      volunteerFamilyId: string, arrangementFunction: string, arrangementFunctionVariant?: string) => {
      const command = new UnassignVolunteerFamily({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId]
      });
      command.volunteerFamilyId = volunteerFamilyId;
      command.arrangementFunction = arrangementFunction;
      command.arrangementFunctionVariant = arrangementFunctionVariant;
      return command;
    });
  const unassignIndividualVolunteer = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      volunteerFamilyId: string, personId: string, arrangementFunction: string, arrangementFunctionVariant?: string) => {
      const command = new UnassignIndividualVolunteer({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId]
      });
      command.volunteerFamilyId = volunteerFamilyId;
      command.personId = personId;
      command.arrangementFunction = arrangementFunction;
      command.arrangementFunctionVariant = arrangementFunctionVariant;
      return command;
    });
  const trackChildLocation = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      childLocationFamilyId: string, childLocationAdultId: string, changedAtLocal: Date,
      childLocationPlan: ChildLocationPlan, noteId: string | null) => {
      const command = new TrackChildLocationChange({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId]
      });
      command.childLocationFamilyId = childLocationFamilyId;
      command.childLocationReceivingAdultId = childLocationAdultId;
      command.changedAtUtc = changedAtLocal;
      command.plan = childLocationPlan;
      if (noteId != null)
        command.noteId = noteId;
      return command;
    });
  const deleteChildLocationEntry = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      childLocationFamilyId: string, childLocationAdultId: string, changedAtLocal: Date,
      noteId: string | null) => {
      const command = new DeleteChildLocationChange({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId]
      });
      command.childLocationFamilyId = childLocationFamilyId;
      command.childLocationReceivingAdultId = childLocationAdultId;
      command.changedAtUtc = changedAtLocal;
      if (noteId != null)
        command.noteId = noteId;
      return command;
    });
  const planChildLocation = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      childLocationFamilyId: string, childLocationAdultId: string, changedAtLocal: Date,
      childLocationPlan: ChildLocationPlan) => {
      const command = new PlanChildLocationChange({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId]
      });
      command.childLocationFamilyId = childLocationFamilyId;
      command.childLocationReceivingAdultId = childLocationAdultId;
      command.plannedChangeUtc = changedAtLocal;
      command.plan = childLocationPlan;
      return command;
    });
  const deleteChildLocationPlan = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      childLocationFamilyId: string, childLocationAdultId: string, changedAtLocal: Date) => {
      const command = new DeletePlannedChildLocationChange({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId]
      });
      command.childLocationFamilyId = childLocationFamilyId;
      command.childLocationReceivingAdultId = childLocationAdultId;
      command.plannedChangeUtc = changedAtLocal;
      return command;
    });
  const updateArrangementComments = useArrangementsCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      comments: string | undefined) => {
      const command = new UpdateArrangementComments({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId]
      });
      command.comments = comments;
      return command;
    });
  const closeReferral = useReferralCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string,
      reason: ReferralCloseReason, closedAtLocal: Date) => {
      const command = new CloseReferral({
        familyId: partneringFamilyId,
        referralId: referralId
      });
      command.closeReason = reason;
      command.closedAtUtc = closedAtLocal;
      return command;
    });
  const openReferral = useReferralCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId,
      openedAtLocal: Date) => {
        const command = new CreateReferral({
          familyId: partneringFamilyId
        });
        command.openedAtUtc = openedAtLocal;
        return command;
      });
  
  return {
    completeReferralRequirement,
    markReferralRequirementIncomplete,
    exemptReferralRequirement,
    unexemptReferralRequirement,
    updateCustomReferralField,
    updateReferralComments,
    completeArrangementRequirement,
    markArrangementRequirementIncomplete,
    exemptArrangementRequirement,
    unexemptArrangementRequirement,
    completeVolunteerFamilyAssignmentRequirement,
    markVolunteerFamilyAssignmentRequirementIncomplete,
    exemptVolunteerFamilyAssignmentRequirement,
    unexemptVolunteerFamilyAssignmentRequirement,
    completeIndividualVolunteerAssignmentRequirement,
    markIndividualVolunteerAssignmentRequirementIncomplete,
    exemptIndividualVolunteerAssignmentRequirement,
    unexemptIndividualVolunteerAssignmentRequirement,
    createArrangement,
    planArrangementStart,
    startArrangement,
    editArrangementStartTime,
    planArrangementEnd,
    endArrangement,
    reopenArrangement,
    cancelArrangement,
    assignVolunteerFamily,
    assignIndividualVolunteer,
    unassignVolunteerFamily,
    unassignIndividualVolunteer,
    trackChildLocation,
    deleteChildLocationEntry,
    planChildLocation,
    deleteChildLocationPlan,
    updateArrangementComments,
    closeReferral,
    openReferral
  };
}
  