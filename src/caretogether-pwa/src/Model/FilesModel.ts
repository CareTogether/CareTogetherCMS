import { AnonymousCredential, BlockBlobClient } from "@azure/storage-blob";
import { authenticatingFetch } from "../Auth";
import { FilesClient } from "../GeneratedClient";

export async function uploadFileToTenant(organizationId: string, locationId: string, formFile: File) {
  const fileBuffer = await formFile.arrayBuffer();
  
  const filesClient = new FilesClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
  const uploadInfo = await filesClient.generateUploadValetUrl(organizationId, locationId);

  const blobClient = new BlockBlobClient(uploadInfo.valetUrl as string, new AnonymousCredential());
  await blobClient.uploadData(fileBuffer);

  return uploadInfo.documentId;
}
