import { selector, useRecoilCallback } from "recoil";
import { ActionRequirement, CompleteVolunteerFamilyRequirement, CompleteVolunteerRequirement, VolunteerCommand, VolunteersClient, VolunteerFamilyCommand, RoleRemovalReason, RemoveVolunteerRole, ResetVolunteerRole, RemoveVolunteerFamilyRole, ResetVolunteerFamilyRole, MarkVolunteerFamilyRequirementIncomplete, CompletedRequirementInfo } from "../GeneratedClient";
import { authenticatingFetch } from "../Auth";
import { currentOrganizationState, currentLocationState } from "./SessionModel";
import { visibleFamiliesData } from "./ModelLoader";

export const volunteerFamiliesData = selector({
  key: 'volunteerFamiliesData',
  get: ({get}) => {
    const visibleFamilies = get(visibleFamiliesData);
    return visibleFamilies.filter(f => f.volunteerFamilyInfo);
  }});

function useVolunteerFamilyCommandCallbackWithLocation<T extends unknown[]>(
  callback: (organizationId: string, locationId: string, volunteerFamilyId: string, ...args: T) => Promise<VolunteerFamilyCommand>) {
  return useRecoilCallback(({snapshot, set}) => {
    const asyncCallback = async (volunteerFamilyId: string, ...args: T) => {
      const organizationId = await snapshot.getPromise(currentOrganizationState);
      const locationId = await snapshot.getPromise(currentLocationState);

      const command = await callback(organizationId, locationId, volunteerFamilyId, ...args);

      const client = new VolunteersClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
      const updatedFamily = await client.submitVolunteerFamilyCommand(organizationId, locationId, command);

      set(visibleFamiliesData, current => {
        return current.map(currentEntry => currentEntry.family?.id === volunteerFamilyId
          ? updatedFamily
          : currentEntry);
      });
    };
    return asyncCallback;
  })
}

// function useVolunteerFamilyCommandCallback<T extends unknown[]>(
//   callback: (volunteerFamilyId: string, ...args: T) => Promise<VolunteerFamilyCommand>) {
//   return useVolunteerFamilyCommandCallbackWithLocation<T>(
//     (_organizationId, _locationId, volunteerFamilyId, ...args) => callback(volunteerFamilyId, ...args));
// }

function useVolunteerCommandCallbackWithLocation<T extends unknown[]>(
  callback: (organizationId: string, locationId: string, volunteerFamilyId: string, personId: string, ...args: T) => Promise<VolunteerCommand>) {
  return useRecoilCallback(({snapshot, set}) => {
    const asyncCallback = async (volunteerFamilyId: string, personId: string, ...args: T) => {
      const organizationId = await snapshot.getPromise(currentOrganizationState);
      const locationId = await snapshot.getPromise(currentLocationState);

      const command = await callback(organizationId, locationId, volunteerFamilyId, personId, ...args);

      const client = new VolunteersClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
      const updatedFamily = await client.submitVolunteerCommand(organizationId, locationId, command);

      set(visibleFamiliesData, current => {
        return current.map(currentEntry => currentEntry.family?.id === volunteerFamilyId
          ? updatedFamily
          : currentEntry);
      });
    };
    return asyncCallback;
  })
}

// function useVolunteerCommandCallback<T extends unknown[]>(
//   callback: (volunteerFamilyId: string, personId: string, ...args: T) => Promise<VolunteerCommand>) {
//   return useVolunteerCommandCallbackWithLocation<T>(
//     (_organizationId, _locationId, volunteerFamilyId, personId, ...args) => callback(volunteerFamilyId, personId, ...args));
// }

export function useVolunteersModel() {
  const completeFamilyRequirement = useVolunteerFamilyCommandCallbackWithLocation(
    async (organizationId, locationId, volunteerFamilyId, requirementName: string, requirement: ActionRequirement,
      completedAtLocal: Date, documentId: string | null) => {
      const command = new CompleteVolunteerFamilyRequirement({
        familyId: volunteerFamilyId
      });
      command.requirementName = requirementName;
      command.completedAtUtc = completedAtLocal;
      if (documentId != null)
        command.uploadedDocumentId = documentId;
      return command;
    });
  const markFamilyRequirementIncomplete = useVolunteerFamilyCommandCallbackWithLocation(
    async (organizationId, locationId, volunteerFamilyId, completedRequirement: CompletedRequirementInfo) => {
      const command = new MarkVolunteerFamilyRequirementIncomplete({
        familyId: volunteerFamilyId
      });
      command.requirementName = completedRequirement.requirementName;
      command.completedRequirementId = completedRequirement.completedRequirementId;
      return command;
    });
  const removeFamilyRole = useVolunteerFamilyCommandCallbackWithLocation(
    async (organizationId, locationId, volunteerFamilyId,
      role: string, reason: RoleRemovalReason, additionalComments: string) =>
    {
      const command = new RemoveVolunteerFamilyRole({
        familyId: volunteerFamilyId
      });
      command.roleName = role;
      command.reason = reason;
      command.additionalComments = additionalComments;
      return command;
    });
  const resetFamilyRole = useVolunteerFamilyCommandCallbackWithLocation(
    async (organizationId, locationId, volunteerFamilyId,
      role: string) =>
    {
      const command = new ResetVolunteerFamilyRole({
        familyId: volunteerFamilyId
      });
      command.roleName = role;
      return command;
    });
  const completeIndividualRequirement = useVolunteerCommandCallbackWithLocation(
    async (organizationId, locationId, volunteerFamilyId, personId, requirementName: string, requirement: ActionRequirement,
      completedAtLocal: Date, documentId: string | null) => {
      const command = new CompleteVolunteerRequirement({
        familyId: volunteerFamilyId,
        personId: personId
      });
      command.requirementName = requirementName;
      command.completedAtUtc = completedAtLocal;
      if (documentId != null)
        command.uploadedDocumentId = documentId;
      return command;
    });
  const removeIndividualRole = useVolunteerCommandCallbackWithLocation(
    async (organizationId, locationId, volunteerFamilyId, personId,
      role: string, reason: RoleRemovalReason, additionalComments: string) =>
    {
      const command = new RemoveVolunteerRole({
        familyId: volunteerFamilyId,
        personId: personId
      });
      command.roleName = role;
      command.reason = reason;
      command.additionalComments = additionalComments;
      return command;
    });
  const resetIndividualRole = useVolunteerCommandCallbackWithLocation(
    async (organizationId, locationId, volunteerFamilyId, personId,
      role: string) =>
    {
      const command = new ResetVolunteerRole({
        familyId: volunteerFamilyId,
        personId: personId
      });
      command.roleName = role;
      return command;
    });
  
  return {
    completeFamilyRequirement,
    markFamilyRequirementIncomplete,
    removeFamilyRole,
    resetFamilyRole,
    completeIndividualRequirement,
    removeIndividualRole,
    resetIndividualRole
  };
}
