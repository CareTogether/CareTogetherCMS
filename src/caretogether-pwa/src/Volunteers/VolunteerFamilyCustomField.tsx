import { CompletedCustomFieldInfo, CustomField } from '../GeneratedClient';
import { useRecoilValue } from 'recoil';
import { policyData } from '../Model/ConfigurationModel';
import { CustomFieldEditor } from '../Generic/CustomFieldEditor';
import { useVolunteersModel } from '../Model/VolunteersModel';

type VolunteerFamilyCustomFieldProps = {
  familyId: string;
  customField: CompletedCustomFieldInfo | string;
};

export function VolunteerFamilyCustomField({
  familyId,
  customField,
}: VolunteerFamilyCustomFieldProps) {
  const policy = useRecoilValue(policyData);

  const savedCustomField =
    customField instanceof CompletedCustomFieldInfo ? customField : null;
  const customFieldPolicy = policy.volunteerPolicy!.customFields!.find((cf) =>
    savedCustomField
      ? cf.name === savedCustomField.customFieldName
      : cf.name === customField
  ) as CustomField;

  const volunteersModel = useVolunteersModel();

  return (
    <CustomFieldEditor
      customFieldPolicy={customFieldPolicy}
      completedCustomFieldInfo={
        customField instanceof CompletedCustomFieldInfo
          ? customField
          : undefined
      }
      onSave={async (value) => {
        await volunteersModel.updateCustomVolunteerFamilyField(
          familyId,
          customFieldPolicy,
          value
        );
      }}
    />
  );
}
