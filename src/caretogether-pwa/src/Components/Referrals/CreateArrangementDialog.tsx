import { useState } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, TextField } from '@mui/material';
import { CombinedFamilyInfo, ArrangementPolicy, ChildInvolvement } from '../../GeneratedClient';
import { visibleFamiliesData } from '../../Model/ModelLoader';
import { DatePicker } from '@mui/lab';
import { useRecoilValue } from 'recoil';
import { useParams } from 'react-router-dom';
import { useBackdrop } from '../../useBackdrop';
import { useReferralsModel } from '../../Model/ReferralsModel';

const useStyles = makeStyles((theme) => ({
  form: {
    '& .MuiFormControl-root': {
    }
  },
  ageYears: {
    width: '20ch'
  }
}));

interface CreateArrangementDialogProps {
  referralId: string,
  arrangementPolicy: ArrangementPolicy
  onClose: () => void
}

export function CreateArrangementDialog({referralId, arrangementPolicy, onClose}: CreateArrangementDialogProps) {
  const classes = useStyles();
  const { familyId } = useParams<{ familyId: string }>();
  const visibleFamilies = useRecoilValue(visibleFamiliesData);
  const family = visibleFamilies.find(x => x.family?.id === familyId) as CombinedFamilyInfo;

  // An arrangement is always either for one adult or one child in the partnering family.
  const applicableFamilyMembers = arrangementPolicy.childInvolvement === ChildInvolvement.NoChildInvolvement
    ? family.family!.adults!.filter(adult => adult.item1!.active).map(adult => adult.item1!)
    : family.family!.children!;

  const [fields, setFields] = useState({
    requestedAtLocal: null as Date | null,
    partneringFamilyPersonId: null as string | null
  });
  const { requestedAtLocal, partneringFamilyPersonId } = fields;
  
  const referralsModel = useReferralsModel();
  
  const withBackdrop = useBackdrop();

  async function save() {
    await withBackdrop(async () => {
      if (!partneringFamilyPersonId) {
        alert("A partnering family member was not selected. Try again.");
      } else if (requestedAtLocal == null) {
        alert("A date is required.");
      } else {
        await referralsModel.createArrangement(family.family?.id as string, referralId,
          arrangementPolicy.arrangementType!, requestedAtLocal, partneringFamilyPersonId);
        //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
        onClose();
      }
    });
  }

  return (
    <Dialog open={true} onClose={onClose} scroll='body' aria-labelledby="create-arrangement-title">
      <DialogTitle id="create-arrangement-title">
        Create {arrangementPolicy.arrangementType}
      </DialogTitle>
      <DialogContent>
        <form className={classes.form} noValidate autoComplete="off">
          <Grid container spacing={2}>
            <Grid item>
              <DatePicker
                label="Requested at"
                value={requestedAtLocal} maxDate={new Date()}
                inputFormat="MM/dd/yyyy"
                onChange={(date: any) => date && setFields({...fields, requestedAtLocal: date})}
                renderInput={(params: any) => <TextField size="small" required {...params} sx={{marginTop: 1}} />} />
            </Grid>
            <Grid item xs={12}>
              <FormControl required component="fieldset">
                <FormLabel component="legend">Family Member:</FormLabel>
                <RadioGroup aria-label="familyMember" name="familyMember"
                  value={partneringFamilyPersonId} onChange={e => setFields({...fields, partneringFamilyPersonId: e.target.value})}>
                  {applicableFamilyMembers.map(person => (
                    <FormControlLabel key={person.id} value={person.id} control={<Radio size="small" />} label={person.firstName!} />
                  ))}
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={save} variant="contained" color="primary"
          disabled={!partneringFamilyPersonId}>
          Create Arrangement
        </Button>
      </DialogActions>
    </Dialog>
  );
}
