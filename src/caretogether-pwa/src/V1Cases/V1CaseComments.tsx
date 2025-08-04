import { Box, TextField, Typography } from '@mui/material';
import {
  CombinedFamilyInfo,
  Permission,
  Referral as V1Case,
} from '../GeneratedClient';
import { useV1CasesModel } from '../Model/V1CasesModel';
import { useFamilyPermissions } from '../Model/SessionModel';
import { useInlineEditor } from '../Hooks/useInlineEditor';

type V1CaseCommentsProps = {
  partneringFamily: CombinedFamilyInfo;
  v1CaseId: string;
};

export function V1CaseComments({
  partneringFamily,
  v1CaseId,
}: V1CaseCommentsProps) {
  const v1CasesModel = useV1CasesModel();
  const permissions = useFamilyPermissions(partneringFamily);
  const openV1Cases: V1Case[] =
    partneringFamily?.partneringFamilyInfo?.openReferral !== undefined
      ? [partneringFamily.partneringFamilyInfo.openReferral]
      : [];
  const closedV1Cases: V1Case[] =
    partneringFamily?.partneringFamilyInfo?.closedReferrals === undefined
      ? []
      : [...partneringFamily.partneringFamilyInfo.closedReferrals!].sort(
          (r1, r2) =>
            r1.closedAtUtc!.getUTCMilliseconds() -
            r2.closedAtUtc!.getUTCMilliseconds()
        );
  const allCases: V1Case[] = [...openV1Cases, ...closedV1Cases];
  const savedValue = allCases.find((r) => r!.id == v1CaseId)!.comments;
  const editor = useInlineEditor(async (savedValue) => {
    await v1CasesModel.updateV1CaseComments(
      partneringFamily.family!.id!,
      v1CaseId,
      savedValue
    );
  }, savedValue);

  return permissions(Permission.ViewReferralComments) ? (
    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      <Typography
        className="ph-unmask"
        variant="h3"
        style={{ marginBottom: 0 }}
      >
        Comments
        {permissions(Permission.EditReferral) && (
          <>
            {editor.editButton}
            {editor.cancelButton}
            {editor.saveButton}
          </>
        )}
      </Typography>
      {editor.editing && permissions(Permission.EditReferral) ? (
        <TextField
          id="v1case-comments"
          helperText="V1 Case comments are visible to everyone."
          placeholder="Space for any general notes about the V1 Case, upcoming plans, etc."
          multiline
          fullWidth
          variant="outlined"
          minRows={2}
          size="medium"
          value={editor.value ?? ''}
          onChange={(e) => editor.setValue(e.target.value)}
        />
      ) : (
        savedValue
      )}
    </Box>
  ) : (
    <></>
  );
}
