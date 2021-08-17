import { atom, useRecoilCallback } from "recoil";
import { ActivityRequirement, FormUploadRequirement, PerformVolunteerFamilyActivity, UploadVolunteerFamilyForm, VolunteerFamiliesClient, VolunteerFamily, VolunteerFamilyCommand } from "../GeneratedClient";
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

export function useVolunteerFamiliesModel() {
  const uploadForm = useVolunteerFamilyCommandCallbackWithLocation(
    async (organizationId, locationId, volunteerFamilyId, requirement: FormUploadRequirement, formFile: File) => {
      const uploadedDocumentId = await uploadFileToTenant(organizationId, locationId, formFile);

      const command = new UploadVolunteerFamilyForm({
        familyId: volunteerFamilyId
      });
      command.formName = requirement.formName;
      command.formVersion = requirement.formVersion;
      command.uploadedDocumentId = uploadedDocumentId;
      command.uploadedFileName = formFile.name;
      return command;
    });
  const performActivity = useVolunteerFamilyCommandCallback(
    async (volunteerFamilyId, requirement: ActivityRequirement, performedAtLocal: Date) => {
      const command = new PerformVolunteerFamilyActivity({
        familyId: volunteerFamilyId
      });
      command.activityName = requirement.activityName;
      command.performedAtUtc = new Date(performedAtLocal.toUTCString());
      return command;
    });
  
  return {
    uploadForm,
    performActivity
  };
}
