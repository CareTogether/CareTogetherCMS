import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import {
  Arrangement,
  CombinedFamilyInfo,
  Permission,
} from '../../GeneratedClient';
import { useV1CasesModel } from '../../Model/V1CasesModel';
import { useFamilyPermissions } from '../../Model/SessionModel';
import { useInlineEditor } from '../../Hooks/useInlineEditor';
import { useRecoilValue } from 'recoil';
import { locationConfigurationQuery } from '../../Model/ConfigurationModel';

type ArrangementReasonProps = {
  partneringFamily: CombinedFamilyInfo;
  v1CaseId: string;
  arrangement: Arrangement;
};

export function ArrangementReason({
  partneringFamily,
  v1CaseId,
  arrangement,
}: ArrangementReasonProps) {
  const savedValue = arrangement.reason;

  const v1CasesModel = useV1CasesModel();
  const permissions = useFamilyPermissions(partneringFamily);

  const arrangementReasons = useRecoilValue(
    locationConfigurationQuery
  )?.arrangementReasons;

  const editor = useInlineEditor(async (value) => {
    await v1CasesModel.editArrangementReason(
      partneringFamily.family!.id!,
      v1CaseId,
      arrangement.id!,
      value && value.length > 0 ? value : null
    );
  }, savedValue);

  return (
    <>
      {arrangementReasons && arrangementReasons.length > 0 ? (
        <>
          Reason:&nbsp;
          {editor.editing ? (
            <FormControl required fullWidth size="small">
              <InputLabel id="arrangement-reason">
                Reason for Request
              </InputLabel>
              <Select
                labelId="arrangement-reason-label"
                id="arrangement-reason"
                value={editor.value || ''}
                onChange={(e) => editor.setValue(e.target.value)}
              >
                <MenuItem key="placeholder" value="" disabled>
                  Select a reason
                </MenuItem>
                {arrangementReasons.map((arrangementReason) => (
                  <MenuItem key={arrangementReason} value={arrangementReason}>
                    {arrangementReason}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : savedValue && savedValue.length > 0 ? (
            savedValue
          ) : (
            '(reason unknown)'
          )}
          {permissions(Permission.EditArrangement) && (
            <>
              {editor.editButton}
              {editor.cancelButton}
              {editor.saveButton}
            </>
          )}
        </>
      ) : (
        <></>
      )}
    </>
  );
}
