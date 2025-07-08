import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
} from '@mui/material';
import {
  CombinedFamilyInfo,
  ArrangementPolicy,
  ChildInvolvement,
} from '../../GeneratedClient';
import { DatePicker } from '@mui/x-date-pickers';
import { useRecoilValue } from 'recoil';
import { useParams } from 'react-router-dom';
import { useBackdrop } from '../../Hooks/useBackdrop';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { visibleFamiliesQuery } from '../../Model/Data';
import { locationConfigurationQuery } from '../../Model/ConfigurationModel';
import { isBackdropClick } from '../../Utilities/handleBackdropClick';

interface CreateArrangementDialogProps {
  referralId: string;
  arrangementPolicy: ArrangementPolicy;
  onClose: () => void;
}

export function CreateArrangementDialog({
  referralId,
  arrangementPolicy,
  onClose,
}: CreateArrangementDialogProps) {
  const { familyId } = useParams<{ familyId: string }>();
  const visibleFamilies = useRecoilValue(visibleFamiliesQuery);
  const family = visibleFamilies.find(
    (x) => x.family?.id === familyId
  ) as CombinedFamilyInfo;

  const arrangementReasons = useRecoilValue(
    locationConfigurationQuery
  )?.arrangementReasons;
  const isReasonRequired = arrangementReasons && arrangementReasons.length > 0;

  // An arrangement is always either for one adult or one child in the partnering family.
  const applicableFamilyMembers =
    arrangementPolicy.childInvolvement === ChildInvolvement.NoChildInvolvement
      ? family
          .family!.adults!.filter((adult) => adult.item1!.active)
          .map((adult) => adult.item1!)
      : family.family!.children!;

  const [fields, setFields] = useState({
    requestedAtLocal: null as Date | null,
    partneringFamilyPersonId: null as string | null,
    reason: null as string | null,
  });
  const { requestedAtLocal, partneringFamilyPersonId, reason } = fields;

  const referralsModel = useReferralsModel();

  const withBackdrop = useBackdrop();

  async function save() {
    await withBackdrop(async () => {
      if (!partneringFamilyPersonId) {
        alert('A partnering family member was not selected. Try again.');
      } else if (requestedAtLocal == null) {
        alert('A date is required.');
      } else if (isReasonRequired && (reason == null || reason.length == 0)) {
        alert('A reason for the request is required.');
      } else {
        await referralsModel.createArrangement(
          family.family?.id as string,
          referralId,
          arrangementPolicy.arrangementType!,
          requestedAtLocal,
          partneringFamilyPersonId,
          reason && reason.length > 0 ? reason : null
        );
        //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
        onClose();
      }
    });
  }

  return (
    <Dialog
      open={true}
      onClose={(_, reason: string) => (!isBackdropClick(reason) ? onClose : {})}
      scroll="body"
      aria-labelledby="create-arrangement-title"
    >
      <DialogTitle id="create-arrangement-title">
        Create {arrangementPolicy.arrangementType}
      </DialogTitle>
      <DialogContent>
        <form noValidate autoComplete="off">
          <Grid container spacing={2}>
            <Grid item>
              <DatePicker
                label="Requested at"
                value={requestedAtLocal}
                maxDate={new Date()}
                format="MM/dd/yyyy"
                onChange={(date: Date | null) =>
                  date && setFields({ ...fields, requestedAtLocal: date })
                }
                slotProps={{
                  textField: {
                    size: 'small',
                    required: true,
                    sx: { marginTop: 1 },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl required component="fieldset">
                <FormLabel component="legend">Family Member:</FormLabel>
                <RadioGroup
                  aria-label="familyMember"
                  name="familyMember"
                  value={partneringFamilyPersonId}
                  onChange={(e) =>
                    setFields({
                      ...fields,
                      partneringFamilyPersonId: e.target.value,
                    })
                  }
                >
                  {applicableFamilyMembers.map((person) => (
                    <FormControlLabel
                      key={person.id}
                      value={person.id}
                      control={<Radio size="small" />}
                      label={person.firstName!}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Grid>
            {arrangementReasons && arrangementReasons.length > 0 && (
              <Grid item xs={12} sm={6}>
                <FormControl required fullWidth size="small">
                  <InputLabel id="arrangement-reason-label">
                    Reason for Request
                  </InputLabel>
                  <Select
                    labelId="arrangement-reason-label"
                    id="arrangement-reason"
                    value={reason || ''}
                    onChange={(e) =>
                      setFields({ ...fields, reason: e.target.value as string })
                    }
                  >
                    <MenuItem key="placeholder" value="" disabled>
                      Select a reason
                    </MenuItem>
                    {arrangementReasons.map((arrangementReason) => (
                      <MenuItem
                        key={arrangementReason}
                        value={arrangementReason}
                      >
                        {arrangementReason}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={save}
          variant="contained"
          color="primary"
          disabled={
            !partneringFamilyPersonId ||
            (isReasonRequired && (!reason || reason.length == 0))
          }
        >
          Create Arrangement
        </Button>
      </DialogActions>
    </Dialog>
  );
}
