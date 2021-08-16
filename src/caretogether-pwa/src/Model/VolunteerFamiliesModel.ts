import { atom, RecoilState, Snapshot, useRecoilCallback } from "recoil";
import { FormUploadRequirement, UploadVolunteerFamilyForm, VolunteerFamiliesClient, VolunteerFamily, VolunteerFamilyCommand } from "../GeneratedClient";
import { authenticatingFetch } from "../Auth";
import { currentOrganizationState, currentLocationState } from "./SessionModel";
import { uploadFileToTenant } from "./FilesModel";

export const volunteerFamiliesData = atom<VolunteerFamily[]>({
  key: 'volunteerFamiliesData',
  default: []
});

async function runVolunteerFamilyCommandCallback(snapshot: Snapshot, set: <T>(recoilVal: RecoilState<T>, valOrUpdater: T | ((currVal: T) => T)) => void,
  volunteerFamilyId: string, callback: (organizationId: string, locationId: string) => Promise<VolunteerFamilyCommand>) {
  const organizationId = await snapshot.getPromise(currentOrganizationState);
  const locationId = await snapshot.getPromise(currentLocationState);

  const command = await callback(organizationId, locationId);
  const vfc = new VolunteerFamiliesClient(process.env.REACT_APP_API_HOST, authenticatingFetch);

  const updatedFamily = await vfc.submitVolunteerFamilyCommand(organizationId, locationId, command);

  set(volunteerFamiliesData, current => {
    return current.map(currentEntry => currentEntry.family?.id === volunteerFamilyId
      ? updatedFamily
      : currentEntry);
  });
}

export function useVolunteerFamiliesModel() {
  const uploadForm = useRecoilCallback(({snapshot, set}) =>
    async (volunteerFamilyId: string, requirement: FormUploadRequirement, formFile: File) => {
      await runVolunteerFamilyCommandCallback(snapshot, set, volunteerFamilyId, async (organizationId, locationId) => {
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
    });
  
  return {
    uploadForm
  };
}
