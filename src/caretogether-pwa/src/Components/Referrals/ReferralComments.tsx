import { TextField } from "@mui/material";
import { CombinedFamilyInfo } from "../../GeneratedClient";
import { useReferralsModel } from "../../Model/ReferralsModel";
import { useInlineEditor } from "../../useInlineEditor";

type ReferralCommentsProps = {
  partneringFamily: CombinedFamilyInfo
  referralId: string
}

export function ReferralComments({ partneringFamily, referralId }: ReferralCommentsProps) {
  const savedValue = partneringFamily.partneringFamilyInfo?.openReferral?.comments;

  const referralsModel = useReferralsModel();

  const editor = useInlineEditor(async value => {
    await referralsModel.updateReferralComments(partneringFamily.family!.id!, referralId, value);
  }, savedValue);

  return (
    <>
      <h3 style={{ marginBottom: 0 }}>
        Comments
        {editor.editButton}
        {editor.cancelButton}
        {editor.saveButton}
      </h3>
      {editor.editing
        ? <TextField
            id="referral-comments"
            helperText="Referral comments are visible to everyone."
            placeholder="Space for any general notes about the referral, upcoming plans, etc."
            multiline fullWidth variant="outlined" minRows={2} size="medium"
            value={editor.value}
            onChange={e => editor.setValue(e.target.value)} />
        : savedValue}
    </>
  );
}
