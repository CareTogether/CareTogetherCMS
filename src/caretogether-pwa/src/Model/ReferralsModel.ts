import { selector, useRecoilCallback } from "recoil";
import { authenticatingFetch } from "../Auth";
import { ReferralCommand, ReferralsClient, ArrangementCommand, ActionRequirement, CompleteReferralRequirement, CreateArrangement, CompleteArrangementRequirement, StartArrangement, EndArrangement, AssignVolunteerFamily, AssignIndividualVolunteer, ReferralCloseReason, CloseReferral, CreateReferral, TrackChildLocationChange, ChildLocationPlan, UpdateCustomReferralField, CustomField } from "../GeneratedClient";
import { visibleFamiliesData } from "./ModelLoader";
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

function useArrangementCommandCallbackWithLocation<T extends unknown[]>(
  callback: (organizationId: string, locationId: string, partneringFamilyId: string, personId: string, ...args: T) => Promise<ArrangementCommand>) {
  return useRecoilCallback(({snapshot, set}) => {
    const asyncCallback = async (partneringFamilyId: string, personId: string, ...args: T) => {
      const organizationId = await snapshot.getPromise(currentOrganizationState);
      const locationId = await snapshot.getPromise(currentLocationState);

      const command = await callback(organizationId, locationId, partneringFamilyId, personId, ...args);

      const client = new ReferralsClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
      const updatedFamily = await client.submitArrangementCommand(organizationId, locationId, command);

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
      completedAtLocal: Date, documentId: string | null) => {
      const command = new CompleteReferralRequirement({
        familyId: partneringFamilyId,
        referralId: referralId,
      });
      command.requirementName = requirementName;
      command.completedAtUtc = completedAtLocal;
      if (documentId != null)
        command.uploadedDocumentId = documentId;
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
  const completeArrangementRequirement = useArrangementCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string, requirementName: string, requirement: ActionRequirement,
      completedAtLocal: Date, documentId: string | null) => {
      const command = new CompleteArrangementRequirement({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementId: arrangementId
      });
      command.requirementName = requirementName;
      command.completedAtUtc = completedAtLocal;
      if (documentId != null)
        command.uploadedDocumentId = documentId;
      return command;
    });
  const createArrangement = useArrangementCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementType: string,
      requestedAtLocal: Date, partneringFamilyPersonId: string) => {
      const command = new CreateArrangement({
        familyId: partneringFamilyId,
        referralId: referralId
      });
      command.arrangementType = arrangementType;
      command.requestedAtUtc = requestedAtLocal;
      command.partneringFamilyPersonId = partneringFamilyPersonId;
      return command;
    });
  const startArrangement = useArrangementCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      startedAtLocal: Date) => {
      const command = new StartArrangement({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementId: arrangementId
      });
      command.startedAtUtc = startedAtLocal;
      return command;
    });
  const endArrangement = useArrangementCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      endedAtLocal: Date) => {
      const command = new EndArrangement({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementId: arrangementId
      });
      command.endedAtUtc = endedAtLocal;
      return command;
    });
  const assignVolunteerFamily = useArrangementCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      volunteerFamilyId: string, arrangementFunction: string) => {
      const command = new AssignVolunteerFamily({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementId: arrangementId
      });
      command.volunteerFamilyId = volunteerFamilyId;
      command.arrangementFunction = arrangementFunction;
      return command;
    });
  const assignIndividualVolunteer = useArrangementCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      volunteerFamilyId: string, personId: string, arrangementFunction: string) => {
      const command = new AssignIndividualVolunteer({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementId: arrangementId
      });
      command.volunteerFamilyId = volunteerFamilyId;
      command.personId = personId;
      command.arrangementFunction = arrangementFunction;
      return command;
    });
  const trackChildLocation = useArrangementCommandCallbackWithLocation(
    async (organizationId, locationId, partneringFamilyId, referralId: string, arrangementId: string,
      childLocationFamilyId: string, childLocationAdultId: string, changedAtLocal: Date,
      childLocationPlan: ChildLocationPlan, additionalExplanation: string) => {
      const command = new TrackChildLocationChange({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementId: arrangementId
      });
      command.childLocationFamilyId = childLocationFamilyId;
      //command.childLocationAdultId = childLocationAdultId; TODO: Implement this!
      command.changedAtUtc = changedAtLocal;
      command.plan = childLocationPlan;
      command.additionalExplanation = additionalExplanation;
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
    updateCustomReferralField,
    completeArrangementRequirement,
    createArrangement,
    startArrangement,
    endArrangement,
    assignVolunteerFamily,
    assignIndividualVolunteer,
    trackChildLocation,
    closeReferral,
    openReferral
  };
}
  