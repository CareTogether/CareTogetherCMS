import { AnonymousCredential, BlockBlobClient } from "@azure/storage-blob";
import { authenticatingFetch } from "../Authentication/AuthenticatedHttp";
import { FilesClient } from "../GeneratedClient";

export async function uploadFamilyFileToTenant(organizationId: string, locationId: string, familyId: string, formFile: File) {
  const fileBuffer = await formFile.arrayBuffer();
  const documentId = crypto.randomUUID();
  
  const filesClient = new FilesClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
  const uploadInfo = await filesClient.generateFamilyDocumentUploadValetUrl(organizationId, locationId, familyId, documentId);

  const blobClient = new BlockBlobClient(uploadInfo.valetUrl as string, new AnonymousCredential());
  await blobClient.uploadData(fileBuffer, {
    blobHTTPHeaders: {
      blobContentType: 'application/octet-stream; charset=utf-8',
      blobContentDisposition: `attachment; filename="${formFile.name}"`
    }
  });

  return uploadInfo.documentId as string;
}

export async function downloadFamilyFile(organizationId: string, locationId: string, familyId: string, documentId: string) {  
  const filesClient = new FilesClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
  const downloadUrl = await filesClient.getFamilyDocumentReadValetUrl(organizationId, locationId, familyId, documentId);

  window.location.href = downloadUrl;
}

export async function uploadCommunityFileToTenant(organizationId: string, locationId: string, communityId: string, formFile: File) {
  const fileBuffer = await formFile.arrayBuffer();
  const documentId = crypto.randomUUID();
  
  const filesClient = new FilesClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
  const uploadInfo = await filesClient.generateCommunityDocumentUploadValetUrl(organizationId, locationId, communityId, documentId);

  const blobClient = new BlockBlobClient(uploadInfo.valetUrl as string, new AnonymousCredential());
  await blobClient.uploadData(fileBuffer, {
    blobHTTPHeaders: {
      blobContentType: 'application/octet-stream; charset=utf-8',
      blobContentDisposition: `attachment; filename="${formFile.name}"`
    }
  });

  return uploadInfo.documentId as string;
}

export async function downloadCommunityFile(organizationId: string, locationId: string, communityId: string, documentId: string) {  
  const filesClient = new FilesClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
  const downloadUrl = await filesClient.getCommunityDocumentReadValetUrl(organizationId, locationId, communityId, documentId);

  window.location.href = downloadUrl;
}
