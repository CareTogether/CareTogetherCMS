import { Box, Checkbox, TextField } from "@mui/material";
import { CompletedCustomFieldInfo, CustomField, CustomFieldType } from "../../GeneratedClient";
import { useReferralsModel } from "../../Model/ReferralsModel";
import { useRecoilValue } from "recoil";
import { policyData } from "../../Model/ConfigurationModel";
import { useInlineEditor } from "../../useInlineEditor";

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
  const type = customFieldPolicy.type!;

  const savedValue = savedCustomField?.value;

  const referralsModel = useReferralsModel();
  const editor = useInlineEditor(async value => {
    await referralsModel.updateCustomReferralField(partneringFamilyId, referralId,
      customFieldPolicy, value);
  }, savedValue);

  return (
    <Box style={{margin:0}}>
      <span>
        {customFieldPolicy.name}:&nbsp;
        {editor.editing
          ? type === CustomFieldType.Boolean
            ? <Checkbox
                size="medium"
                checked={(editor.value as boolean | null) === null || typeof(editor.value) === 'undefined'
                  ? false
                  : editor.value as boolean}
                onChange={e => editor.setValue(e.target.checked)} />
            : <TextField
                variant="outlined" size="medium"
                value={editor.value || ""}
                onChange={e => editor.setValue(e.target.value)} />
          : typeof(savedValue) === 'undefined'
            ? "❓"
            : type === CustomFieldType.Boolean
              ? savedValue ? "Yes" : "No"
              : savedValue}
      </span>
      {editor.editButton}
      {editor.cancelButton}
      {editor.saveButton}
    </Box>
  );
}
