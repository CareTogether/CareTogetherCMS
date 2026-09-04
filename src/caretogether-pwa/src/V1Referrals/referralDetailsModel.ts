import { familyNameString } from '../Families/FamilyName';
import {
  CombinedFamilyInfo,
  CustomField,
  CustomFieldType,
  UploadedDocumentInfo,
  V1Case,
} from '../GeneratedClient';

export type ReferralFamilyOption = {
  id: string;
  label: string;
};

export type ReferralCaseOption = {
  id: string;
  label: string;
};

export type ReferralFamilyActionFlags = {
  canCreateClientFamily: boolean;
  canLinkExistingCase: boolean;
  canOpenCase: boolean;
  canSelectFamily: boolean;
};

export type ReferralCustomFieldDisplayRow = {
  name: string;
  displayValue: string;
};

export type ReferralDocumentDisplayRow = {
  document: UploadedDocumentInfo;
  uploadedDocumentId?: string;
  uploadedFileName?: string;
};

type ReferralFamilyActionInputs = {
  canCreateAnyV1Case: boolean;
  canCreateFamilyV1Case: boolean;
  canEditAnyFamilyInfo: boolean;
  canEditFamilyV1Case: boolean;
  canEditReferral: boolean;
  familyHasAnyCase: boolean;
  familyHasOpenCase: boolean;
  hasReferralFamily: boolean;
  isClosed: boolean;
  isOpen: boolean;
  referralAlreadyLinkedToCase: boolean;
};

function formatDate(date?: Date) {
  return date
    ? new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date)
    : undefined;
}

export function formatReferralCaseLabel(
  isOpenCase: boolean,
  closedAtUtc?: Date
) {
  if (isOpenCase) {
    return 'Open Case';
  }

  const closedDate = formatDate(closedAtUtc);
  return closedDate ? `Closed Case (${closedDate})` : 'Closed Case';
}

export function findLinkedV1ReferralCase(
  family: CombinedFamilyInfo | undefined,
  referralId: string
): V1Case | undefined {
  if (
    family?.partneringFamilyInfo?.openV1Case?.linkedV1ReferralIds?.includes(
      referralId
    )
  ) {
    return family.partneringFamilyInfo.openV1Case;
  }

  return family?.partneringFamilyInfo?.closedV1Cases?.find((v1Case) =>
    v1Case.linkedV1ReferralIds?.includes(referralId)
  );
}

export function familyHasOpenV1Case(family: CombinedFamilyInfo | undefined) {
  return !!family?.partneringFamilyInfo?.openV1Case;
}

export function familyHasAnyV1Case(family: CombinedFamilyInfo | undefined) {
  return (
    !!family?.partneringFamilyInfo?.openV1Case ||
    (family?.partneringFamilyInfo?.closedV1Cases?.length ?? 0) > 0
  );
}

export function buildReferralFamilyOptions(
  families: CombinedFamilyInfo[]
): ReferralFamilyOption[] {
  return families
    .filter((family) => family.family?.id)
    .map((family) => ({
      id: family.family!.id,
      label: familyNameString(family),
    }));
}

export function buildReferralCaseOptionsForFamily(
  family: CombinedFamilyInfo | undefined
): ReferralCaseOption[] {
  return [
    ...(family?.partneringFamilyInfo?.openV1Case
      ? [
          {
            id: family.partneringFamilyInfo.openV1Case.id,
            label: formatReferralCaseLabel(true),
          },
        ]
      : []),
    ...(family?.partneringFamilyInfo?.closedV1Cases?.map((v1Case) => ({
      id: v1Case.id,
      label: formatReferralCaseLabel(false, v1Case.closedAtUtc),
    })) ?? []),
  ];
}

export function deriveReferralFamilyActionFlags({
  canCreateAnyV1Case,
  canCreateFamilyV1Case,
  canEditAnyFamilyInfo,
  canEditFamilyV1Case,
  canEditReferral,
  familyHasAnyCase,
  familyHasOpenCase,
  hasReferralFamily,
  isClosed,
  isOpen,
  referralAlreadyLinkedToCase,
}: ReferralFamilyActionInputs): ReferralFamilyActionFlags {
  return {
    canCreateClientFamily:
      !isClosed &&
      !hasReferralFamily &&
      canEditReferral &&
      canEditAnyFamilyInfo &&
      canCreateAnyV1Case,
    canSelectFamily: isOpen && !hasReferralFamily && canEditReferral,
    canOpenCase:
      isOpen &&
      hasReferralFamily &&
      !familyHasOpenCase &&
      canEditReferral &&
      canCreateFamilyV1Case &&
      canEditFamilyV1Case,
    canLinkExistingCase:
      !isClosed &&
      hasReferralFamily &&
      familyHasAnyCase &&
      !referralAlreadyLinkedToCase &&
      canEditReferral &&
      canEditFamilyV1Case,
  };
}

export function formatReferralCustomFieldDisplayValue(
  field: CustomField,
  value: unknown
) {
  if (value === null || value === undefined || value === '') {
    return '\u2014';
  }

  return field.type === CustomFieldType.Boolean
    ? value === true
      ? 'Yes'
      : 'No'
    : String(value);
}

export function buildReferralCustomFieldDisplayRows(
  customFields: CustomField[],
  completedCustomFields:
    | Record<string, { value?: unknown } | undefined>
    | undefined
): ReferralCustomFieldDisplayRow[] {
  return customFields.map((field) => ({
    name: field.name,
    displayValue: formatReferralCustomFieldDisplayValue(
      field,
      completedCustomFields?.[field.name]?.value
    ),
  }));
}

export function buildReferralDocumentDisplayRows(
  uploadedDocuments: UploadedDocumentInfo[] | undefined
): ReferralDocumentDisplayRow[] {
  return (
    uploadedDocuments?.map((document) => ({
      document,
      uploadedDocumentId: document.uploadedDocumentId,
      uploadedFileName: document.uploadedFileName,
    })) ?? []
  );
}
