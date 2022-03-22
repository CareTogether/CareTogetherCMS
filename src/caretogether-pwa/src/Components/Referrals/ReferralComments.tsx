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
  const savedComments = partneringFamily.partneringFamilyInfo?.openReferral?.comments;

  const referralsModel = useReferralsModel();
  const withBackdrop = useBackdrop();

  const [commentsEditing, setCommentsEditing] = useState(false);
  const [referralComments, setReferralComments] = useState(savedComments);
  async function saveReferralComments() {
    await withBackdrop(async () => {
      await referralsModel.updateReferralComments(partneringFamily.family!.id!, referralId, referralComments);
      setCommentsEditing(false);
    });
  }
  function cancelCommentsEditing() {
    setCommentsEditing(false);
    setReferralComments(savedComments);
  }

  return (
    <>
      <h3 style={{ marginBottom: 0 }}>
        Comments
        {!commentsEditing && <Button
          onClick={() => setCommentsEditing(true)}
          variant="text"
          size="small"
          startIcon={<EditIcon />}
          sx={{margin: 1}}>
          Edit
        </Button>}
        {commentsEditing &&
        <>
          <Button
            onClick={() => cancelCommentsEditing()}
            variant="contained"
            size="small"
            startIcon={<UndoIcon />}
            color="secondary"
            sx={{margin: 1}}>
            Cancel
          </Button>
          <Button
            disabled={referralComments === savedComments}
            onClick={saveReferralComments}
            variant="contained"
            size="small"
            startIcon={<SaveIcon />}
            sx={{margin: 1}}>
            Save Comments
          </Button>
        </>}
      </h3>
      {commentsEditing
        ? <TextField
            id="comments" label="Comments"
            placeholder="Space for any general notes about the referral, upcoming plans, etc."
            multiline fullWidth variant="outlined" minRows={2} size="medium"
            value={referralComments}
            onChange={e => setReferralComments(e.target.value)} />
        : savedComments}
    </>
  );
}
