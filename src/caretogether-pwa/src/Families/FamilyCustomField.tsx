import { CompletedCustomFieldInfo, CustomField } from '../GeneratedClient';
import { useRecoilValue } from 'recoil';
import { policyData } from '../Model/ConfigurationModel';
import { CustomFieldEditor } from '../Generic/CustomFieldEditor';
import { CustomFieldEditorV2 } from '../Families/FamilyProfile/CustomFieldEditorNoIcon';
import { useDirectoryModel } from '../Model/DirectoryModel';

type FamilyCustomFieldProps = {
  familyId: string;
  customField: CompletedCustomFieldInfo | string;
  isEditable?: boolean;
  isNewCustomField: boolean;
};

export function FamilyCustomField({
  familyId,
  customField,
  isEditable,
  isNewCustomField = false,
}: FamilyCustomFieldProps) {
  const policy = useRecoilValue(policyData);

  const savedCustomField =
    customField instanceof CompletedCustomFieldInfo ? customField : null;
  const customFieldPolicy = policy.customFamilyFields!.find((cf) =>
    savedCustomField
      ? cf.name === savedCustomField.customFieldName
      : cf.name === customField
  ) as CustomField;

  const directoryModel = useDirectoryModel();

  const SelectedCustomFieldEditor = isNewCustomField
    ? CustomFieldEditorV2
    : CustomFieldEditor;

  return (
    <SelectedCustomFieldEditor
      customFieldPolicy={customFieldPolicy}
      completedCustomFieldInfo={
        customField instanceof CompletedCustomFieldInfo
          ? customField
          : undefined
      }
      onSave={async (value: string | boolean | null) => {
        await directoryModel.updateCustomFamilyField(
          familyId,
          customFieldPolicy,
          value
        );
      }}
      isEditable={isEditable}
    />
  );
}
