import { selector, useRecoilCallback } from "recoil";
import { authenticatingFetch } from "../Auth";
import { ReferralCommand, ReferralsClient, ArrangementCommand, ActionRequirement, CompleteReferralRequirement } from "../GeneratedClient";
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

// function useArrangementCommandCallbackWithLocation<T extends unknown[]>(
//   callback: (organizationId: string, locationId: string, partneringFamilyId: string, personId: string, ...args: T) => Promise<ArrangementCommand>) {
//   return useRecoilCallback(({snapshot, set}) => {
//     const asyncCallback = async (partneringFamilyId: string, personId: string, ...args: T) => {
//       const organizationId = await snapshot.getPromise(currentOrganizationState);
//       const locationId = await snapshot.getPromise(currentLocationState);

//       const command = await callback(organizationId, locationId, partneringFamilyId, personId, ...args);

//       const client = new ReferralsClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
//       const updatedFamily = await client.submitArrangementCommand(organizationId, locationId, command);

//       set(visibleFamiliesData, current => {
//         return current.map(currentEntry => currentEntry.family?.id === partneringFamilyId
//           ? updatedFamily
//           : currentEntry);
//       });
//     };
//     return asyncCallback;
//   })
// }

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
  // const removeFamilyRole = useReferralCommandCallbackWithLocation(
  //   async (organizationId, locationId, partneringFamilyId,
  //     role: string, reason: RoleRemovalReason, additionalComments: string) =>
  //   {
  //     const command = new RemovePartneringFamilyRole({
  //       familyId: partneringFamilyId
  //     });
  //     command.roleName = role;
  //     command.reason = reason;
  //     command.additionalComments = additionalComments;
  //     return command;
  //   });
  // const resetFamilyRole = useReferralCommandCallbackWithLocation(
  //   async (organizationId, locationId, partneringFamilyId,
  //     role: string) =>
  //   {
  //     const command = new ResetPartneringFamilyRole({
  //       familyId: partneringFamilyId
  //     });
  //     command.roleName = role;
  //     return command;
  //   });
  // const completeIndividualRequirement = useArrangementCommandCallbackWithLocation(
  //   async (organizationId, locationId, partneringFamilyId, personId, requirementName: string, requirement: ActionRequirement,
  //     completedAtLocal: Date, documentId: string | null) => {
  //     const command = new CompletePartneringRequirement({
  //       familyId: partneringFamilyId,
  //       personId: personId
  //     });
  //     command.requirementName = requirementName;
  //     command.completedAtUtc = completedAtLocal;
  //     if (documentId != null)
  //       command.uploadedDocumentId = documentId;
  //     return command;
  //   });
  // const removeIndividualRole = useArrangementCommandCallbackWithLocation(
  //   async (organizationId, locationId, partneringFamilyId, personId,
  //     role: string, reason: RoleRemovalReason, additionalComments: string) =>
  //   {
  //     const command = new RemovePartneringRole({
  //       familyId: partneringFamilyId,
  //       personId: personId
  //     });
  //     command.roleName = role;
  //     command.reason = reason;
  //     command.additionalComments = additionalComments;
  //     return command;
  //   });
  // const resetIndividualRole = useArrangementCommandCallbackWithLocation(
  //   async (organizationId, locationId, partneringFamilyId, personId,
  //     role: string) =>
  //   {
  //     const command = new ResetPartneringRole({
  //       familyId: partneringFamilyId,
  //       personId: personId
  //     });
  //     command.roleName = role;
  //     return command;
  //   });
  
  return {
    completeReferralRequirement
    // completeFamilyRequirement,
    // removeFamilyRole,
    // resetFamilyRole,
    // completeIndividualRequirement,
    // removeIndividualRole,
    // resetIndividualRole
  };
}
  