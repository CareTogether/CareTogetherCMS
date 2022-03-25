import { Button, TextField } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import { useState } from "react";
import { CombinedFamilyInfo } from "../../GeneratedClient";
import { useReferralsModel } from "../../Model/ReferralsModel";
import { useBackdrop } from "../RequestBackdrop";

type ReferralCommentsProps = {
  partneringFamily: CombinedFamilyInfo
  referralId: string
}

export function ReferralComments({ partneringFamily, referralId }: ReferralCommentsProps) {
  const savedValue = partneringFamily.partneringFamilyInfo?.openReferral?.comments;

  const referralsModel = useReferralsModel();
  const withBackdrop = useBackdrop();

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(savedValue);
  async function saveChanges() {
    await withBackdrop(async () => {
      await referralsModel.updateReferralComments(partneringFamily.family!.id!, referralId, value);
      setEditing(false);
    });
  }
  function cancelEditing() {
    setEditing(false);
    setValue(savedValue);
  }

  return (
    <>
      <h3 style={{ marginBottom: 0 }}>
        Comments
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
      </h3>
      {editing
        ? <TextField
            id="referral-comments"
            helperText="Referral comments are visible to everyone."
            placeholder="Space for any general notes about the referral, upcoming plans, etc."
            multiline fullWidth variant="outlined" minRows={2} size="medium"
            value={value}
            onChange={e => setValue(e.target.value)} />
        : savedValue}
    </>
  );
}
