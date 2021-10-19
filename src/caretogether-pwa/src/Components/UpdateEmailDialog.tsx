import { useState } from 'react';
import { FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, TextField } from '@material-ui/core';
import { Person, EmailAddressType } from '../GeneratedClient';
import { useVolunteerFamiliesModel } from '../Model/VolunteerFamiliesModel';
import { UpdateDialog } from './UpdateDialog';

interface UpdateEmailDialogProps {
  volunteerFamilyId: string,
  person: Person,
  onClose: () => void
}

export function UpdateEmailDialog({volunteerFamilyId, person, onClose}: UpdateEmailDialogProps) {
  const volunteerFamiliesModel = useVolunteerFamiliesModel();
  const currentEmailAddress = person.emailAddresses?.find(x => x.id === person.preferredEmailAddressId);
  const [fields, setFields] = useState({
    emailAddress: currentEmailAddress?.address || "",
    emailType: currentEmailAddress?.type || EmailAddressType.Personal
  });
  const { emailAddress, emailType } = fields;

  async function save() {
    if (currentEmailAddress)
      await volunteerFamiliesModel.updatePersonEmailAddress(volunteerFamilyId, person.id as string,
        currentEmailAddress.id!, emailAddress, emailType);
    else
      await volunteerFamiliesModel.addPersonEmailAddress(volunteerFamilyId, person.id as string,
        emailAddress, emailType);
  }

  return (
    <UpdateDialog title={`Update Email for ${person.firstName} ${person.lastName}`} onClose={onClose}
      onSave={save} enableSave={() => emailAddress !== currentEmailAddress?.address || emailType !== currentEmailAddress?.type}>
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
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
          </Grid>
        </Grid>
      </form>
    </UpdateDialog>
  );
}
