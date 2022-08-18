import { Autocomplete, Box, FormControlLabel, Radio, RadioGroup, TextField } from "@mui/material";
import { CompletedCustomFieldInfo, CustomField, CustomFieldType, CustomFieldValidation } from "../GeneratedClient";
import { useReferralsModel } from "../Model/ReferralsModel";
import { useRecoilValue } from "recoil";
import { policyData } from "../Model/ConfigurationModel";
import { useInlineEditor } from "../Hooks/useInlineEditor";

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
            ? <>
                <RadioGroup
                  name="boolean-custom-field" row
                  value={(editor.value as boolean | null) == null ? "" : editor.value ? "yes" : "no"}
                  onChange={e => editor.setValue(e.target.value === "yes" ? true : e.target.value === "no" ? false : null)}
                >
                  <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio />} label="No" />
                  <FormControlLabel value="" control={<Radio />} label="(blank)" />
                </RadioGroup>
              </>
            : customFieldPolicy.validation === CustomFieldValidation.SuggestOnly
              ? <Autocomplete
                  freeSolo
                  onInputChange={(event: any, newValue: string) => {
                    editor.setValue(newValue)
                  }}
                  options={(customFieldPolicy.validValues || []).slice().sort((a, b) => -b.localeCompare(a))}
                  renderInput={(params) => <TextField required {...params} />}
                  inputValue={editor.value}
                />
              :  <TextField
                variant="outlined" size="medium"
                value={editor.value || ""}
                onChange={e => editor.setValue(e.target.value)} />
          : typeof(savedValue) === 'undefined' || savedValue == null
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
