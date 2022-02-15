import { useState } from 'react';
import { FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, TextField } from '@material-ui/core';
import { CompletedCustomFieldInfo, CustomField, CustomFieldType } from '../../GeneratedClient';
import { UpdateDialog } from '../UpdateDialog';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { useRecoilValue } from 'recoil';
import { policyData } from '../../Model/ConfigurationModel';

interface CustomReferralFieldDialogProps {
  partneringFamilyId: string,
  referralId: string,
  customField: string | CompletedCustomFieldInfo,
  onClose: () => void
}

export function CustomReferralFieldDialog({partneringFamilyId, referralId, customField, onClose}: CustomReferralFieldDialogProps) {
  const referralsModel = useReferralsModel();
  const policy = useRecoilValue(policyData);

  const isEdit = typeof customField !== 'string';

  const customFieldPolicy = policy.referralPolicy!.customFields!.find(cf =>
    isEdit
    ? cf.name === customField.customFieldName
    : cf.name === customField) as CustomField;
  const type = customFieldPolicy.type!;

  const [value, setValue] = useState<boolean | string | null>(isEdit ? customField.value : null);

  async function save() {
    await referralsModel.completeCustomReferralField(partneringFamilyId, referralId,
      customFieldPolicy, value);
  }

  return (
    <UpdateDialog title={
      isEdit
      ? `Edit referral information`
      : `Enter referral information`
    } onClose={onClose}
      onSave={save} enableSave={() => true}>
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          { type === CustomFieldType.Boolean
            ? (
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">{isEdit ? customField.customFieldName : customField}</FormLabel>
                  <RadioGroup aria-label="value" name="value"
                    value={value == null ? '' : value.toString()}
                    onChange={e => setValue(e.target.value === 'true')}>
                    <FormControlLabel value={'true'} control={<Radio size="small" />} label="Yes" />
                    <FormControlLabel value={'false'} control={<Radio size="small" />} label="No" />
                  </RadioGroup>
                </FormControl>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <TextField id="value" label={isEdit ? customField.customFieldName : customField} fullWidth size="small"
                  value={value == null ? '' : value} onChange={e => setValue(e.target.value)} />
              </Grid>
            ) }
        </Grid>
      </form>
    </UpdateDialog>
  );
}
