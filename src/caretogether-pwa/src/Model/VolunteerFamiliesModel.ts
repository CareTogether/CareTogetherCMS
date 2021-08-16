import { atom, RecoilState, Snapshot } from "recoil";
import { FilesClient, FormUploadRequirement, UploadVolunteerFamilyForm, VolunteerFamiliesClient, VolunteerFamily } from "../GeneratedClient";
import { authenticatingFetch } from "../Auth";
import { currentOrganizationState, currentLocationState } from "./SessionModel";
import { AnonymousCredential, BlockBlobClient } from "@azure/storage-blob";

export const volunteerFamiliesData = atom<VolunteerFamily[]>({
  key: 'volunteerFamiliesData',
  default: []
});

export async function uploadVolunteerFamilyForm(snapshot: Snapshot,
  set: <T>(recoilVal: RecoilState<T>, valOrUpdater: T | ((currVal: T) => T)) => void,
  volunteerFamilyId: string, requirement: FormUploadRequirement, formFile: File) {
  const organizationId = await snapshot.getPromise(currentOrganizationState);
  const locationId = await snapshot.getPromise(currentLocationState);
  
  const fileBuffer = await formFile.arrayBuffer();

  const filesClient = new FilesClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
  const uploadInfo = await filesClient.generateUploadValetUrl(organizationId, locationId);

  const blobClient = new BlockBlobClient(uploadInfo.valetUrl as string, new AnonymousCredential());
  await blobClient.uploadData(fileBuffer);

  const vfc = new VolunteerFamiliesClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
  const uploadCommand = new UploadVolunteerFamilyForm({
    familyId: volunteerFamilyId
  });
  uploadCommand.formName = requirement.formName;
  uploadCommand.formVersion = requirement.formVersion;
  uploadCommand.uploadedDocumentId = uploadInfo.documentId;
  uploadCommand.uploadedFileName = formFile.name;
  const updatedFamily = await vfc.submitVolunteerFamilyCommand(organizationId, locationId, uploadCommand);

  set(volunteerFamiliesData, current => {
    return current.map(currentEntry => currentEntry.family?.id === volunteerFamilyId
      ? updatedFamily
      : currentEntry);
  });
}
