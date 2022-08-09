import { TextField } from "@mui/material";
import { Arrangement, CombinedFamilyInfo, Permission } from "../../GeneratedClient";
import { useReferralsModel } from "../../Model/ReferralsModel";
import { usePermissions } from "../../Model/SessionModel";
import { useInlineEditor } from "../../useInlineEditor";

type ArrangementCommentsProps = {
  partneringFamily: CombinedFamilyInfo
  referralId: string
  arrangement: Arrangement
}

export function ArrangementComments({ partneringFamily, referralId, arrangement }: ArrangementCommentsProps) {
  const savedValue = arrangement.comments;

  const referralsModel = useReferralsModel();
  const permissions = usePermissions();

  const editor = useInlineEditor(async value => {
    await referralsModel.updateArrangementComments(
      partneringFamily.family!.id!, referralId, arrangement.id!, value);
  }, savedValue);

  return (
    <>
      {editor.editing
        ? <TextField
            id="arrangement-comments"
            helperText="Arrangement comments are visible to everyone."
            placeholder="Space for any general notes about the arrangement, upcoming plans, etc."
            multiline fullWidth variant="outlined" minRows={2} size="medium"
            value={editor.value}
            onChange={e => editor.setValue(e.target.value)} />
        : (savedValue && savedValue.length > 0)
        ? savedValue
        : "(no comments)"}
      {permissions(Permission.EditArrangement) &&
        <>
          {editor.editButton}
          {editor.cancelButton}
          {editor.saveButton}
        </>}
    </>
  );
}
