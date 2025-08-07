import { TextField } from '@mui/material';
import {
  Arrangement,
  CombinedFamilyInfo,
  Permission,
} from '../../GeneratedClient';
import { useV1CasesModel } from '../../Model/V1CasesModel';
import { useFamilyPermissions } from '../../Model/SessionModel';
import { useInlineEditor } from '../../Hooks/useInlineEditor';

type ArrangementCommentsProps = {
  partneringFamily: CombinedFamilyInfo;
  v1CaseId: string;
  arrangement: Arrangement;
};

export function ArrangementComments({
  partneringFamily,
  v1CaseId: v1CaseId,
  arrangement,
}: ArrangementCommentsProps) {
  const savedValue = arrangement.comments;

  const v1CasesModel = useV1CasesModel();
  const permissions = useFamilyPermissions(partneringFamily);

  const editor = useInlineEditor(async (value) => {
    await v1CasesModel.updateArrangementComments(
      partneringFamily.family!.id!,
      v1CaseId,
      arrangement.id!,
      value
    );
  }, savedValue);

  return (
    <>
      {editor.editing ? (
        <TextField
          id="arrangement-comments"
          helperText="Arrangement comments are visible to everyone."
          placeholder="Space for any general notes about the arrangement, upcoming plans, etc."
          multiline
          fullWidth
          variant="outlined"
          minRows={2}
          size="medium"
          value={editor.value}
          onChange={(e) => editor.setValue(e.target.value)}
        />
      ) : savedValue && savedValue.length > 0 ? (
        savedValue
      ) : (
        '(no comments)'
      )}
      {permissions(Permission.EditArrangement) && (
        <>
          {editor.editButton}
          {editor.cancelButton}
          {editor.saveButton}
        </>
      )}
    </>
  );
}
