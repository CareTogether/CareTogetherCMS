import { CompletedCustomFieldInfo, CustomField } from '../../GeneratedClient';
import { useRecoilValue } from 'recoil';
import { policyData } from '../../Model/ConfigurationModel';
import { CustomFieldEditorV2 } from '../../Families/FamilyProfile/CustomFieldEditorNoIcon';
import { useDirectoryModel } from '../../Model/DirectoryModel';

type FamilyCustomFieldV2Props = {
  familyId: string;
  customField: CompletedCustomFieldInfo | string;
  isEditable?: boolean;
};

export function FamilyCustomFieldV2({
  familyId,
  customField,
  isEditable = false,
}: FamilyCustomFieldV2Props) {
  const policy = useRecoilValue(policyData);

  const savedCustomField =
    customField instanceof CompletedCustomFieldInfo ? customField : null;
  const customFieldPolicy = policy.customFamilyFields!.find((cf) =>
    savedCustomField
      ? cf.name === savedCustomField.customFieldName
      : cf.name === customField
  ) as CustomField;

  const directoryModel = useDirectoryModel();

  return (
    <CustomFieldEditorV2
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
