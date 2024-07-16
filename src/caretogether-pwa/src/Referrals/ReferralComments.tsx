import { Box, TextField } from "@mui/material";
import { CombinedFamilyInfo, Permission, Referral } from "../GeneratedClient";
import { useReferralsModel } from "../Model/ReferralsModel";
import { useFamilyPermissions } from "../Model/SessionModel";
import { useInlineEditor } from "../Hooks/useInlineEditor";

type ReferralCommentsProps = {
  partneringFamily: CombinedFamilyInfo
  referralId: string
}

export function ReferralComments({ partneringFamily, referralId }: ReferralCommentsProps) {
  const referralsModel = useReferralsModel();
  const permissions = useFamilyPermissions(partneringFamily);
  const openReferrals: Referral[] = (partneringFamily?.partneringFamilyInfo?.openReferral !== undefined) ? [partneringFamily.partneringFamilyInfo.openReferral] : [];
  const closedReferrals: Referral[] = (partneringFamily?.partneringFamilyInfo?.closedReferrals === undefined) ? [] :
    [...partneringFamily.partneringFamilyInfo.closedReferrals!].sort((r1, r2) => r1.closedAtUtc!.getUTCMilliseconds() - r2.closedAtUtc!.getUTCMilliseconds());
  const allReferrals: Referral[] = [...openReferrals, ...closedReferrals];
  const savedValue = allReferrals.find(r => r!.id == referralId)!.comments;
  const editor = useInlineEditor(async savedValue => {
    await referralsModel.updateReferralComments(partneringFamily.family!.id!, referralId, savedValue);
  }, savedValue);

  return permissions(Permission.ViewReferralComments)
    ?
    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      <h3 style={{ margin: 0 }}>
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
          value={editor.value ?? ''}
          onChange={e => editor.setValue(e.target.value)} />
        : savedValue}
    </Box>
    : <></>;
}
