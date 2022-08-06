import { useParams } from 'react-router';
import { Arrangement, Person } from '../../GeneratedClient';
import { usePersonLookup } from '../../Model/DirectoryModel';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { UpdateDialog } from '../UpdateDialog';

interface ReopenArrangementDialogProps {
  referralId: string,
  arrangement: Arrangement,
  onClose: () => void
}

export function ReopenArrangementDialog({referralId, arrangement, onClose}: ReopenArrangementDialogProps) {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;
  
  const referralsModel = useReferralsModel();
  const personLookup = usePersonLookup();
  
  const person = personLookup(familyId, arrangement.partneringFamilyPersonId) as Person;

  async function save() {
    await referralsModel.reopenArrangement(familyId, referralId, arrangement.id!, null);
  }

  return (
    <UpdateDialog title={`Do you want to reopen this already-ended ${arrangement.arrangementType} arrangement for ${person.firstName} ${person.lastName}?`}
      onClose={onClose} onSave={save} /*enableSave={() => cancelledAtLocal != null}*/>
      {/* <Grid container spacing={0}>
        <Grid item xs={12}>
          <DateTimePicker
            label="When was this arrangement cancelled?"
            value={cancelledAtLocal}
            disableFuture inputFormat="M/d/yyyy h:mma"
            onChange={(date) => date && setFields({ ...fields, cancelledAtLocal: date })}
            showTodayButton
            renderInput={(params) => <TextField fullWidth required {...params} sx={{marginTop: 1}} />} />
        </Grid>
      </Grid> */}
    </UpdateDialog>
  );
}
