import { CompletedCustomFieldInfo } from '../GeneratedClient';
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
  const volunteersModel = useVolunteersModel();

  const volunteerCustomFields = policy.volunteerPolicy?.customFields;
  if (!volunteerCustomFields) return null;

  const savedCustomField =
    customField instanceof CompletedCustomFieldInfo ? customField : null;
  const customFieldPolicy = volunteerCustomFields.find((cf) =>
    savedCustomField
      ? cf.name === savedCustomField.customFieldName
      : cf.name === customField
  );

  if (!customFieldPolicy) return null;

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
