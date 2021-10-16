import { useState } from 'react';
import { Grid, TextField } from '@material-ui/core';
import { Person } from '../GeneratedClient';
import { useVolunteerFamiliesModel } from '../Model/VolunteerFamiliesModel';
import { UpdateDialog } from './UpdateDialog';

interface UpdateEmailDialogProps {
  volunteerFamilyId: string,
  person: Person,
  onClose: () => void
}

export function UpdateEmailDialog({volunteerFamilyId, person, onClose}: UpdateEmailDialogProps) {
  const [fields, setFields] = useState({
    notes: person.notes || ''
  });
  const { notes } = fields;
  const volunteerFamiliesModel = useVolunteerFamiliesModel();

  async function save() {
    alert("TODO");
    // await volunteerFamiliesModel.updatePersonNotes(volunteerFamilyId, person.id as string,
    //   notes.length > 0 ? notes : null);
  }

  return (
    <UpdateDialog title={`Update Email for ${person.firstName} ${person.lastName}`} onClose={onClose}
      onSave={save} enableSave={() => notes !== person.notes}>
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          {/* <Grid item xs={12} sm={6}>
            <TextField id="email-address" label="Email Address" fullWidth size="small" type="email"
              value={emailAddress} onChange={e => setFields({...fields, emailAddress: e.target.value})} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Email Type:</FormLabel>
              <RadioGroup aria-label="emailType" name="emailType" row
                value={EmailAddressType[emailType]} onChange={e => setFields({...fields, emailType: EmailAddressType[e.target.value as keyof typeof EmailAddressType]})}>
                <FormControlLabel value={EmailAddressType[EmailAddressType.Personal]} control={<Radio size="small" />} label="Personal" />
                <FormControlLabel value={EmailAddressType[EmailAddressType.Work]} control={<Radio size="small" />} label="Work" />
              </RadioGroup>
            </FormControl>
          </Grid> */}
        </Grid>
      </form>
    </UpdateDialog>
  );
}
