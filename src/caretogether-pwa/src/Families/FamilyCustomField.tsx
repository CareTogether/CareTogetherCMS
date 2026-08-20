import { CompletedCustomFieldInfo, CustomField } from '../GeneratedClient';
import { usePolicy } from '../Model/PolicyModel';
import { CustomFieldEditor } from '../Generic/CustomFieldEditor';
import { useDirectoryModel } from '../Model/DirectoryModel';

type FamilyCustomFieldProps = {
  familyId: string;
  customField: CompletedCustomFieldInfo | string;
};

export function FamilyCustomField({
  familyId,
  customField,
}: FamilyCustomFieldProps) {
  const policy = usePolicy();

  const savedCustomField =
    customField instanceof CompletedCustomFieldInfo ? customField : null;
  const customFieldPolicy = policy.customFamilyFields!.find((cf) =>
    savedCustomField
      ? cf.name === savedCustomField.customFieldName
      : cf.name === customField
  ) as CustomField;

  const directoryModel = useDirectoryModel();

  return (
    <CustomFieldEditor
      customFieldPolicy={customFieldPolicy}
      completedCustomFieldInfo={
        customField instanceof CompletedCustomFieldInfo
          ? customField
          : undefined
      }
      onSave={async (value) => {
        await directoryModel.updateCustomFamilyField(
          familyId,
          customFieldPolicy,
          value
        );
      }}
    />
  );
}
