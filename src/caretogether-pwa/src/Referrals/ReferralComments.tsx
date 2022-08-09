import { TextField } from "@mui/material";
import { CombinedFamilyInfo, Permission } from "../GeneratedClient";
import { useReferralsModel } from "../Model/ReferralsModel";
import { usePermissions } from "../Model/SessionModel";
import { useInlineEditor } from "../useInlineEditor";

type ReferralCommentsProps = {
  partneringFamily: CombinedFamilyInfo
  referralId: string
}

export function ReferralComments({ partneringFamily, referralId }: ReferralCommentsProps) {
  const savedValue = partneringFamily.partneringFamilyInfo?.openReferral?.comments;

  const referralsModel = useReferralsModel();
  const permissions = usePermissions();

  const editor = useInlineEditor(async value => {
    await referralsModel.updateReferralComments(partneringFamily.family!.id!, referralId, value);
  }, savedValue);

  return permissions(Permission.ViewReferralComments)
    ? <>
        <h3 style={{ marginBottom: 0 }}>
          Comments
          {permissions(Permission.EditReferral) &&
            <>
              {editor.editButton}
              {editor.cancelButton}
              {editor.saveButton}
            </>}
        </h3>
        {editor.editing && permissions(Permission.EditReferral)
          ? <TextField
              id="referral-comments"
              helperText="Referral comments are visible to everyone."
              placeholder="Space for any general notes about the referral, upcoming plans, etc."
              multiline fullWidth variant="outlined" minRows={2} size="medium"
              value={editor.value}
              onChange={e => editor.setValue(e.target.value)} />
          : savedValue}
      </>
    : <></>;
}
