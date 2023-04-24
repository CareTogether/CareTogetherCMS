import { CompletedCustomFieldInfo, CustomField } from "../GeneratedClient";
import { useReferralsModel } from "../Model/ReferralsModel";
import { useRecoilValue } from "recoil";
import { policyData } from "../Model/ConfigurationModel";
import { CustomFieldEditor } from "../Generic/CustomFieldEditor";

type ReferralCustomFieldProps = {
  partneringFamilyId: string
  referralId: string
  customField: CompletedCustomFieldInfo | string;
}

export function ReferralCustomField({ partneringFamilyId, referralId, customField }: ReferralCustomFieldProps) {
  const policy = useRecoilValue(policyData);
  
  const savedCustomField = customField instanceof CompletedCustomFieldInfo ? customField : null;
  const customFieldPolicy = policy.referralPolicy!.customFields!.find(cf =>
    savedCustomField
    ? cf.name === savedCustomField.customFieldName
    : cf.name === customField) as CustomField;

  const referralsModel = useReferralsModel();

  return (
    <CustomFieldEditor
      customFieldPolicy={customFieldPolicy}
      completedCustomFieldInfo={customField instanceof CompletedCustomFieldInfo ? customField : undefined}
      onSave={async (value) => {
        await referralsModel.updateCustomReferralField(partneringFamilyId, referralId, customFieldPolicy, value);
      }} />
  );
}
