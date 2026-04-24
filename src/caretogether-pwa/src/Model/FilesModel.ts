import { AnonymousCredential, BlockBlobClient } from '@azure/storage-blob';
import { api } from '../Api/Api';
import type { IDocumentUploadInfo } from '../GeneratedClient';

type GenerateUploadValetUrl = (documentId: string) => Promise<IDocumentUploadInfo>;
type GetReadValetUrl = () => Promise<string>;

async function uploadFileToTenant(
  formFile: File,
  generateUploadValetUrl: GenerateUploadValetUrl
) {
  const fileBuffer = await formFile.arrayBuffer();
  const documentId = crypto.randomUUID();
  const uploadInfo = await generateUploadValetUrl(documentId);

  const blobClient = new BlockBlobClient(
    uploadInfo.valetUrl as string,
    new AnonymousCredential()
  );
  await blobClient.uploadData(fileBuffer, {
    blobHTTPHeaders: {
      blobContentType: 'application/octet-stream; charset=utf-8',
      blobContentDisposition: `attachment; filename="${formFile.name}"`,
    },
  });

  return uploadInfo.documentId as string;
}

async function downloadFile(getReadValetUrl: GetReadValetUrl) {
  const downloadUrl = await getReadValetUrl();
  window.location.href = downloadUrl;
}

export async function uploadFamilyFileToTenant(
  organizationId: string,
  locationId: string,
  familyId: string,
  formFile: File
) {
  return uploadFileToTenant(formFile, documentId =>
    api.files.generateFamilyDocumentUploadValetUrl(
      organizationId,
      locationId,
      familyId,
      documentId
    )
  );
}

export async function downloadFamilyFile(
  organizationId: string,
  locationId: string,
  familyId: string,
  documentId: string
) {
  return downloadFile(() =>
    api.files.getFamilyDocumentReadValetUrl(
      organizationId,
      locationId,
      familyId,
      documentId
    )
  );
}

export async function uploadCommunityFileToTenant(
  organizationId: string,
  locationId: string,
  communityId: string,
  formFile: File
) {
  return uploadFileToTenant(formFile, documentId =>
    api.files.generateCommunityDocumentUploadValetUrl(
      organizationId,
      locationId,
      communityId,
      documentId
    )
  );
}

export async function downloadCommunityFile(
  organizationId: string,
  locationId: string,
  communityId: string,
  documentId: string
) {
  return downloadFile(() =>
    api.files.getCommunityDocumentReadValetUrl(
      organizationId,
      locationId,
      communityId,
      documentId
    )
  );
}

export async function uploadV1ReferralFileToTenant(
  organizationId: string,
  locationId: string,
  referralId: string,
  formFile: File
) {
  return uploadFileToTenant(formFile, documentId =>
    api.files.generateV1ReferralDocumentUploadValetUrl(
      organizationId,
      locationId,
      referralId,
      documentId
    )
  );
}

export async function downloadV1ReferralFile(
  organizationId: string,
  locationId: string,
  referralId: string,
  documentId: string
) {
  return downloadFile(() =>
    api.files.getV1ReferralDocumentReadValetUrl(
      organizationId,
      locationId,
      referralId,
      documentId
    )
  );
}
