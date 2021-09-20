import { atom, useRecoilCallback } from "recoil";
import { ActivityRequirement, AddAdultToFamilyCommand, AddChildToFamilyCommand, Age, ApprovalCommand, CreateVolunteerFamilyWithNewAdultCommand, CustodialRelationship, FamilyAdultRelationshipInfo, FormUploadRequirement, Gender, PerformVolunteerActivity, PerformVolunteerFamilyActivity, PersonCommand, UpdatePersonName, UploadVolunteerFamilyForm, UploadVolunteerForm, VolunteerCommand, VolunteerFamiliesClient, VolunteerFamily, VolunteerFamilyCommand } from "../GeneratedClient";
import { authenticatingFetch } from "../Auth";
import { currentOrganizationState, currentLocationState } from "./SessionModel";
import { uploadFileToTenant } from "./FilesModel";

export const volunteerFamiliesData = atom<VolunteerFamily[]>({
  key: 'volunteerFamiliesData',
  default: []
});

function useVolunteerFamilyCommandCallbackWithLocation<T extends unknown[]>(
  callback: (organizationId: string, locationId: string, volunteerFamilyId: string, ...args: T) => Promise<VolunteerFamilyCommand>) {
  return useRecoilCallback(({snapshot, set}) => {
    const asyncCallback = async (volunteerFamilyId: string, ...args: T) => {
      const organizationId = await snapshot.getPromise(currentOrganizationState);
      const locationId = await snapshot.getPromise(currentLocationState);

      const command = await callback(organizationId, locationId, volunteerFamilyId, ...args);

      const client = new VolunteerFamiliesClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
      const updatedFamily = await client.submitVolunteerFamilyCommand(organizationId, locationId, command);

      set(volunteerFamiliesData, current => {
        return current.map(currentEntry => currentEntry.family?.id === volunteerFamilyId
          ? updatedFamily
          : currentEntry);
      });
    };
    return asyncCallback;
  })
}

function useVolunteerFamilyCommandCallback<T extends unknown[]>(
  callback: (volunteerFamilyId: string, ...args: T) => Promise<VolunteerFamilyCommand>) {
  return useVolunteerFamilyCommandCallbackWithLocation<T>(
    (_organizationId, _locationId, volunteerFamilyId, ...args) => callback(volunteerFamilyId, ...args));
}

function useVolunteerCommandCallbackWithLocation<T extends unknown[]>(
  callback: (organizationId: string, locationId: string, volunteerFamilyId: string, personId: string, ...args: T) => Promise<VolunteerCommand>) {
  return useRecoilCallback(({snapshot, set}) => {
    const asyncCallback = async (volunteerFamilyId: string, personId: string, ...args: T) => {
      const organizationId = await snapshot.getPromise(currentOrganizationState);
      const locationId = await snapshot.getPromise(currentLocationState);

      const command = await callback(organizationId, locationId, volunteerFamilyId, personId, ...args);

      const client = new VolunteerFamiliesClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
      const updatedFamily = await client.submitVolunteerCommand(organizationId, locationId, command);

      set(volunteerFamiliesData, current => {
        return current.map(currentEntry => currentEntry.family?.id === volunteerFamilyId
          ? updatedFamily
          : currentEntry);
      });
    };
    return asyncCallback;
  })
}

function useVolunteerCommandCallback<T extends unknown[]>(
  callback: (volunteerFamilyId: string, personId: string, ...args: T) => Promise<VolunteerCommand>) {
  return useVolunteerCommandCallbackWithLocation<T>(
    (_organizationId, _locationId, volunteerFamilyId, personId, ...args) => callback(volunteerFamilyId, personId, ...args));
}

function usePersonCommandCallback<T extends unknown[]>(
  callback: (volunteerFamilyId: string, personId: string, ...args: T) => Promise<PersonCommand>) {
  return useRecoilCallback(({snapshot, set}) => {
    const asyncCallback = async (volunteerFamilyId: string, personId: string, ...args: T) => {
      const organizationId = await snapshot.getPromise(currentOrganizationState);
      const locationId = await snapshot.getPromise(currentLocationState);

      const command = await callback(volunteerFamilyId, personId, ...args);

      const client = new VolunteerFamiliesClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
      const updatedFamily = await client.submitPersonCommand(organizationId, locationId, volunteerFamilyId, command);

      set(volunteerFamiliesData, current =>
        current.some(currentEntry => currentEntry.family?.id === volunteerFamilyId)
        ? current.map(currentEntry => currentEntry.family?.id === volunteerFamilyId
          ? updatedFamily
          : currentEntry)
        : current.concat(updatedFamily));
      
      return updatedFamily;
    };
    return asyncCallback;
  })
}

function useApprovalCommandCallback<T extends unknown[]>(
  callback: (volunteerFamilyId: string, personId: string, ...args: T) => Promise<ApprovalCommand>) {
  return useRecoilCallback(({snapshot, set}) => {
    const asyncCallback = async (volunteerFamilyId: string, personId: string, ...args: T) => {
      const organizationId = await snapshot.getPromise(currentOrganizationState);
      const locationId = await snapshot.getPromise(currentLocationState);

      const command = await callback(volunteerFamilyId, personId, ...args);

      const client = new VolunteerFamiliesClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
      const updatedFamily = await client.submitApprovalCommand(organizationId, locationId, command);

      set(volunteerFamiliesData, current =>
        current.some(currentEntry => currentEntry.family?.id === volunteerFamilyId)
        ? current.map(currentEntry => currentEntry.family?.id === volunteerFamilyId
          ? updatedFamily
          : currentEntry)
        : current.concat(updatedFamily));
      
      return updatedFamily;
    };
    return asyncCallback;
  })
}

export function useVolunteerFamiliesModel() {
  const uploadFormFamily = useVolunteerFamilyCommandCallbackWithLocation(
    async (organizationId, locationId, volunteerFamilyId, requirement: FormUploadRequirement, formFile: File, completedAtLocal: Date) => {
      const uploadedDocumentId = await uploadFileToTenant(organizationId, locationId, formFile);

      const command = new UploadVolunteerFamilyForm({
        familyId: volunteerFamilyId
      });
      command.formName = requirement.formName;
      command.formVersion = requirement.formVersion;
      command.uploadedDocumentId = uploadedDocumentId;
      command.uploadedFileName = formFile.name;
      command.completedAtUtc = completedAtLocal;
      return command;
    });
  const performActivityFamily = useVolunteerFamilyCommandCallback(
    async (volunteerFamilyId, requirement: ActivityRequirement, performedAtLocal: Date) => {
      const command = new PerformVolunteerFamilyActivity({
        familyId: volunteerFamilyId
      });
      command.activityName = requirement.activityName;
      command.performedAtUtc = new Date(performedAtLocal.toUTCString());
      return command;
    });
  const uploadFormPerson = useVolunteerCommandCallbackWithLocation(
    async (organizationId, locationId, volunteerFamilyId, personId, requirement: FormUploadRequirement, formFile: File, completedAtLocal: Date) => {
      const uploadedDocumentId = await uploadFileToTenant(organizationId, locationId, formFile);

      const command = new UploadVolunteerForm({
        familyId: volunteerFamilyId,
        personId: personId
      });
      command.formName = requirement.formName;
      command.formVersion = requirement.formVersion;
      command.uploadedDocumentId = uploadedDocumentId;
      command.uploadedFileName = formFile.name;
      command.completedAtUtc = completedAtLocal;
      return command;
    });
  const performActivityPerson = useVolunteerCommandCallback(
    async (volunteerFamilyId, personId, requirement: ActivityRequirement, performedAtLocal: Date) => {
      const command = new PerformVolunteerActivity({
        familyId: volunteerFamilyId,
        personId: personId
      });
      command.activityName = requirement.activityName;
      command.performedAtUtc = new Date(performedAtLocal.toUTCString());
      return command;
    });
  const updatePersonName = usePersonCommandCallback(
    async (volunteerFamilyId, personId, firstName: string, lastName: string) => {
      const command = new UpdatePersonName({
        personId: personId
      });
      command.firstName = firstName;
      command.lastName = lastName;
      return command;
    });
  const addAdult = useApprovalCommandCallback(
    async (volunteerFamilyId, firstName: string, lastName: string, gender: Gender, age: Age, ethnicity: string,
        isInHousehold: boolean, relationshipToFamily?: string,
        notes?: string, concerns?: string) => {
      const command = new AddAdultToFamilyCommand();
      command.familyId = volunteerFamilyId;
      command.firstName = firstName;
      command.lastName = lastName;
      command.gender = gender;
      command.age = age;
      command.ethnicity = ethnicity;
      command.concerns = concerns;
      command.notes = notes;
      command.familyAdultRelationshipInfo = new FamilyAdultRelationshipInfo({
        isInHousehold: isInHousehold,
        relationshipToFamily: relationshipToFamily
      });
      return command;
    });
  const addChild = useApprovalCommandCallback(
    async (volunteerFamilyId, firstName: string, lastName: string, gender: Gender, age: Age, ethnicity: string,
        custodialRelationships: CustodialRelationship[],
        notes?: string, concerns?: string) => {
      const command = new AddChildToFamilyCommand();
      command.familyId = volunteerFamilyId;
      command.firstName = firstName;
      command.lastName = lastName;
      command.gender = gender;
      command.age = age;
      command.ethnicity = ethnicity;
      command.custodialRelationships = custodialRelationships;
      command.concerns = concerns;
      command.notes = notes;
      return command;
    });
  const createVolunteerFamilyWithNewAdult = useApprovalCommandCallback(
    async (firstName: string, lastName: string, gender: Gender, age: Age, ethnicity: string,
      isInHousehold: boolean, relationshipToFamily?: string,
        notes?: string, concerns?: string) => {
      const command = new CreateVolunteerFamilyWithNewAdultCommand();
      command.firstName = firstName;
      command.lastName = lastName;
      command.gender = gender
      command.age = age;
      command.ethnicity = ethnicity;
      command.concerns = concerns;
      command.notes = notes;
      command.familyAdultRelationshipInfo = new FamilyAdultRelationshipInfo({
        isInHousehold: isInHousehold,
        relationshipToFamily: relationshipToFamily
      });
      return command;
    });
  
  return {
    uploadFormFamily,
    performActivityFamily,
    uploadFormPerson,
    performActivityPerson,
    updatePersonName,
    addAdult,
    addChild,
    createVolunteerFamilyWithNewAdult
  };
}
