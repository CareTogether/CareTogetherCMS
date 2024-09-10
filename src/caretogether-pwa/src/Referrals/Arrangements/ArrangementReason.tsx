import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import {
  Arrangement,
  CombinedFamilyInfo,
  Permission,
} from '../../GeneratedClient';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { useFamilyPermissions } from '../../Model/SessionModel';
import { useInlineEditor } from '../../Hooks/useInlineEditor';
import { useRecoilValue } from 'recoil';
import { locationConfigurationQuery } from '../../Model/ConfigurationModel';

type ArrangementReasonProps = {
  partneringFamily: CombinedFamilyInfo;
  referralId: string;
  arrangement: Arrangement;
};

export function ArrangementReason({
  partneringFamily,
  referralId,
  arrangement,
}: ArrangementReasonProps) {
  const savedValue = arrangement.reason;

  const referralsModel = useReferralsModel();
  const permissions = useFamilyPermissions(partneringFamily);

  const arrangementReasons = useRecoilValue(
    locationConfigurationQuery
  )?.arrangementReasons;

  const editor = useInlineEditor(async (value) => {
    await referralsModel.editArrangementReason(
      partneringFamily.family!.id!,
      referralId,
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
