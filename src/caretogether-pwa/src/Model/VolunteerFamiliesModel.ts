import { atom, useRecoilCallback } from "recoil";
import { FormUploadRequirement, UploadVolunteerFamilyForm, VolunteerFamiliesClient, VolunteerFamily, VolunteerFamilyCommand } from "../GeneratedClient";
import { authenticatingFetch } from "../Auth";
import { currentOrganizationState, currentLocationState } from "./SessionModel";
import { uploadFileToTenant } from "./FilesModel";

export const volunteerFamiliesData = atom<VolunteerFamily[]>({
  key: 'volunteerFamiliesData',
  default: []
});

function useVolunteerFamilyCommandCallback<T>(
  callback: (organizationId: string, locationId: string, volunteerFamilyId: string, ...args: T[]) => Promise<VolunteerFamilyCommand>) {
  return useRecoilCallback(({snapshot, set}) => {
    const asyncCallback = async (volunteerFamilyId: string, ...args: T[]) => {
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

export function useVolunteerFamiliesModel() {
  const uploadForm = useVolunteerFamilyCommandCallback(
    async (organizationId, locationId, volunteerFamilyId, [requirement, formFile]:[FormUploadRequirement, File]) => {
      const uploadedDocumentId = await uploadFileToTenant(organizationId, locationId, formFile);

      const uploadCommand = new UploadVolunteerFamilyForm({
        familyId: volunteerFamilyId
      });
      uploadCommand.formName = requirement.formName;
      uploadCommand.formVersion = requirement.formVersion;
      uploadCommand.uploadedDocumentId = uploadedDocumentId;
      uploadCommand.uploadedFileName = formFile.name;

      return uploadCommand;
    });
  
  return {
    uploadForm
  };
}
