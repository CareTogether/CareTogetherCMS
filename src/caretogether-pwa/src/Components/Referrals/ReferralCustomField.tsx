import { Box, Button, Checkbox, TextField } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import { useState } from "react";
import { CompletedCustomFieldInfo, CustomField, CustomFieldType } from "../../GeneratedClient";
import { useReferralsModel } from "../../Model/ReferralsModel";
import { useBackdrop } from "../RequestBackdrop";
import { useRecoilValue } from "recoil";
import { policyData } from "../../Model/ConfigurationModel";

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
  const withBackdrop = useBackdrop();

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<boolean | string | null>(savedValue);
  async function saveChanges() {
    await withBackdrop(async () => {
      await referralsModel.updateCustomReferralField(partneringFamilyId, referralId,
        customFieldPolicy, value);
      setEditing(false);
    });
  }
  function cancelEditing() {
    setEditing(false);
    setValue(savedValue);
  }

  return (
    <Box style={{margin:0}}>
      <span>
        {customFieldPolicy.name}:&nbsp;
        {editing
          ? type === CustomFieldType.Boolean
            ? <Checkbox
                size="medium"
                checked={(value as boolean | null) === null || typeof(value) === 'undefined' ? false : value as boolean}
                onChange={e => setValue(e.target.checked)} />
            : <TextField
                variant="outlined" size="medium"
                value={value || ""}
                onChange={e => setValue(e.target.value)} />
          : typeof(savedValue) === 'undefined'
            ? "❓"
            : type === CustomFieldType.Boolean
              ? savedValue ? "Yes" : "No"
              : savedValue}
      </span>
      {!editing && <Button
        onClick={() => setEditing(true)}
        variant="text"
        size="small"
        startIcon={<EditIcon />}
        sx={{margin: 1}}>
        Edit
      </Button>}
      {editing &&
      <>
        <Button
          onClick={() => cancelEditing()}
          variant="contained"
          size="small"
          startIcon={<UndoIcon />}
          color="secondary"
          sx={{margin: 1}}>
          Cancel
        </Button>
        <Button
          disabled={value === savedValue}
          onClick={saveChanges}
          variant="contained"
          size="small"
          startIcon={<SaveIcon />}
          sx={{margin: 1}}>
          Save
        </Button>
      </>}
    </Box>
  );
}
