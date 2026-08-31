import { CompletedCustomFieldInfo, CustomField } from '../GeneratedClient';
import { useV1CasesModel } from '../Model/V1CasesModel';
import { usePolicy } from '../Model/PolicyModel';
import { CustomFieldEditor } from '../Generic/CustomFieldEditor';

type V1CaseCustomFieldProps = {
  partneringFamilyId: string;
  v1CaseId: string;
  customField: CompletedCustomFieldInfo | string;
};

export function V1CaseCustomField({
  partneringFamilyId,
  v1CaseId,
  customField,
}: V1CaseCustomFieldProps) {
  const policy = usePolicy();

  const savedCustomField =
    customField instanceof CompletedCustomFieldInfo ? customField : null;
  const customFieldPolicy = policy.referralPolicy!.customFields!.find((cf) =>
    savedCustomField
      ? cf.name === savedCustomField.customFieldName
      : cf.name === customField
  ) as CustomField;

  const v1CasesModel = useV1CasesModel();

  return (
    <CustomFieldEditor
      customFieldPolicy={customFieldPolicy}
      completedCustomFieldInfo={
        customField instanceof CompletedCustomFieldInfo
          ? customField
          : undefined
      }
      onSave={async (value) => {
        await v1CasesModel.updateCustomV1CaseField(
          partneringFamilyId,
          v1CaseId,
          customFieldPolicy,
          value
        );
      }}
    />
  );
}
