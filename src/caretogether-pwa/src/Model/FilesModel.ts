import { AnonymousCredential, BlockBlobClient } from "@azure/storage-blob";
import { authenticatingFetch } from "../Authentication/AuthenticatedHttp";
import { FilesClient } from "../GeneratedClient";

export async function uploadFileToTenant(organizationId: string, locationId: string, familyId: string, formFile: File) {
  const fileBuffer = await formFile.arrayBuffer();
  const documentId = crypto.randomUUID();
  
  const filesClient = new FilesClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
  const uploadInfo = await filesClient.generateUploadValetUrl(organizationId, locationId, familyId, documentId);

  const blobClient = new BlockBlobClient(uploadInfo.valetUrl as string, new AnonymousCredential());
  await blobClient.uploadData(fileBuffer, {
    blobHTTPHeaders: {
      blobContentType: 'application/octet-stream; charset=utf-8',
      blobContentDisposition: `attachment; filename="${formFile.name}"`
    }
  });

  return uploadInfo.documentId as string;
}

export async function downloadFile(organizationId: string, locationId: string, familyId: string, documentId: string) {  
  const filesClient = new FilesClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
  const downloadUrl = await filesClient.getReadValetUrl(organizationId, locationId, familyId, documentId);

  window.location.href = downloadUrl;
}
