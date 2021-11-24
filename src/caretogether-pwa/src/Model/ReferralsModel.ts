import { selector, useRecoilCallback } from "recoil";
import { authenticatingFetch } from "../Auth";
import { ReferralCommand, ReferralsClient, ArrangementCommand, ActionRequirement, CompleteReferralRequirement, CreateArrangement, CompleteArrangementRequirement, StartArrangement, EndArrangement } from "../GeneratedClient";
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
  
  return {
    completeReferralRequirement,
    completeArrangementRequirement,
    createArrangement,
    startArrangement,
    endArrangement
  };
}
  