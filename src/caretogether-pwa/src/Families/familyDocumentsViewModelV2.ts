import {
  CombinedFamilyInfo,
  Permission,
  UploadedDocumentInfo,
  V1Referral,
} from '../GeneratedClient';
import { formatUtcDateOnly } from '../Utilities/dateUtils';

export type FamilyDocumentSourceTypeV2 = 'family' | 'referral';

export type FamilyDocumentPermissionFlagsV2 = {
  canDelete: boolean;
  canDownload: boolean;
  canPreview: boolean;
};

export type FamilyDocumentFamilySourceV2 = {
  document: UploadedDocumentInfo;
  familyId: string;
  type: 'family';
};

export type FamilyDocumentReferralSourceV2 = {
  document: UploadedDocumentInfo;
  referral: V1Referral;
  referralId: string;
  type: 'referral';
};

export type FamilyDocumentRowV2 = {
  documentName: string;
  fileTypeLabel: string;
  id: string;
  sourceType: FamilyDocumentSourceTypeV2;
  ownerId: string;
  permissionFlags: FamilyDocumentPermissionFlagsV2;
  source: FamilyDocumentFamilySourceV2 | FamilyDocumentReferralSourceV2;
  sourceLabel: string;
  uploadDateLabel: string;
  uploadedDocumentId?: string;
  uploadedFileName?: string;
  uploadedAtUtc?: Date;
  uploadedByLabel?: string;
  uploadedByUserId?: string;
  referralTitle?: string;
};

type BuildFamilyDocumentRowsV2Parameters = {
  family: CombinedFamilyInfo;
  permissions: (permission: Permission) => boolean;
  referrals?: V1Referral[];
  uploaderLabel?: (userId?: string) => string | undefined;
};

function familyDocumentRowId(
  familyId: string,
  document: UploadedDocumentInfo,
  index: number
) {
  return `family:${familyId}:${document.uploadedDocumentId ?? index}`;
}

function referralDocumentRowId({
  referral,
  document,
  referralIndex,
  documentIndex,
}: {
  referral: V1Referral;
  document: UploadedDocumentInfo;
  referralIndex: number;
  documentIndex: number;
}) {
  return `referral:${referral.referralId}:${document.uploadedDocumentId ?? `${referralIndex}-${documentIndex}`}`;
}

function documentTimestamp(document: UploadedDocumentInfo) {
  return document.timestampUtc?.getTime() ?? 0;
}

function displayValue(value?: string) {
  return value || '-';
}

function documentName(document: UploadedDocumentInfo) {
  return displayValue(document.uploadedFileName);
}

function documentFileType(document: UploadedDocumentInfo) {
  const fileName = document.uploadedFileName?.trim();
  const extension = fileName?.includes('.')
    ? fileName.split('.').pop()?.trim()
    : undefined;

  return extension ? extension.toLocaleUpperCase() : '-';
}

function documentUploadDate(document: UploadedDocumentInfo) {
  return document.timestampUtc ? formatUtcDateOnly(document.timestampUtc) : '-';
}

function buildFamilyDocumentRows({
  family,
  permissions,
  uploaderLabel,
}: Pick<
  BuildFamilyDocumentRowsV2Parameters,
  'family' | 'permissions' | 'uploaderLabel'
>): FamilyDocumentRowV2[] {
  const familyId = family.family?.id ?? '';
  const canRead = permissions(Permission.ReadFamilyDocuments);
  const canDelete = permissions(Permission.DeleteFamilyDocuments);

  return (
    family.uploadedDocuments?.map((document, index) => ({
      documentName: documentName(document),
      fileTypeLabel: documentFileType(document),
      id: familyDocumentRowId(familyId, document, index),
      sourceType: 'family' as const,
      ownerId: familyId,
      permissionFlags: {
        canDelete,
        canDownload: canRead,
        canPreview: canRead,
      },
      source: {
        document,
        familyId,
        type: 'family' as const,
      },
      sourceLabel: 'Family',
      uploadDateLabel: documentUploadDate(document),
      uploadedDocumentId: document.uploadedDocumentId,
      uploadedFileName: document.uploadedFileName,
      uploadedAtUtc: document.timestampUtc,
      uploadedByLabel: uploaderLabel?.(document.userId),
      uploadedByUserId: document.userId,
    })) ?? []
  );
}

function buildReferralDocumentRows(
  referrals: V1Referral[],
  uploaderLabel?: (userId?: string) => string | undefined
): FamilyDocumentRowV2[] {
  return referrals.flatMap((referral, referralIndex) =>
    (referral.uploadedDocuments ?? []).map((document, documentIndex) => {
      const referralTitle = referral.title ?? 'Referral';

      return {
        documentName: documentName(document),
        fileTypeLabel: documentFileType(document),
        id: referralDocumentRowId({
          referral,
          document,
          referralIndex,
          documentIndex,
        }),
        sourceType: 'referral' as const,
        ownerId: referral.referralId,
        permissionFlags: {
          canDelete: false,
          canDownload: true,
          canPreview: true,
        },
        source: {
          document,
          referral,
          referralId: referral.referralId,
          type: 'referral' as const,
        },
        sourceLabel: `Referral: ${referralTitle}`,
        uploadDateLabel: documentUploadDate(document),
        uploadedDocumentId: document.uploadedDocumentId,
        uploadedFileName: document.uploadedFileName,
        uploadedAtUtc: document.timestampUtc,
        uploadedByLabel: uploaderLabel?.(document.userId),
        uploadedByUserId: document.userId,
        referralTitle,
      };
    })
  );
}

export function buildFamilyDocumentRowsV2({
  family,
  permissions,
  referrals = [],
  uploaderLabel,
}: BuildFamilyDocumentRowsV2Parameters): FamilyDocumentRowV2[] {
  return [
    ...buildFamilyDocumentRows({ family, permissions, uploaderLabel }),
    ...buildReferralDocumentRows(referrals, uploaderLabel),
  ].sort((a, b) => {
    return (
      documentTimestamp(b.source.document) - documentTimestamp(a.source.document)
    );
  });
}
