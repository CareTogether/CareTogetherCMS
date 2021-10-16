import { useState } from 'react';
import { FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, TextField } from '@material-ui/core';
import { Person, PhoneNumberType } from '../GeneratedClient';
import { useVolunteerFamiliesModel } from '../Model/VolunteerFamiliesModel';
import { UpdateDialog } from './UpdateDialog';

interface UpdatePhoneDialogProps {
  volunteerFamilyId: string,
  person: Person,
  onClose: () => void
}

export function UpdatePhoneDialog({volunteerFamilyId, person, onClose}: UpdatePhoneDialogProps) {
  const volunteerFamiliesModel = useVolunteerFamiliesModel();
  const currentPhoneNumber = person.phoneNumbers?.find(x => x.id === person.preferredPhoneNumberId);
  const [fields, setFields] = useState({
    phoneNumber: currentPhoneNumber?.number || "",
    phoneType: currentPhoneNumber?.type || PhoneNumberType.Mobile
  });
  const { phoneNumber, phoneType } = fields;

  async function save() {
    alert("TODO");
    // await volunteerFamiliesModel.updatePersonNotes(volunteerFamilyId, person.id as string,
    //   notes.length > 0 ? notes : null);
  }

  return (
    <UpdateDialog title={`Update Phone for ${person.firstName} ${person.lastName}`} onClose={onClose}
      onSave={save} enableSave={() => phoneNumber !== currentPhoneNumber?.number || phoneType !== currentPhoneNumber?.type}>
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField id="phone-number" label="Phone Number" fullWidth size="small" type="tel"
              value={phoneNumber} onChange={e => setFields({...fields, phoneNumber: e.target.value})} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Phone Type:</FormLabel>
              <RadioGroup aria-label="phoneType" name="phoneType" row
                value={PhoneNumberType[phoneType]} onChange={e => setFields({...fields, phoneType: PhoneNumberType[e.target.value as keyof typeof PhoneNumberType]})}>
                <FormControlLabel value={PhoneNumberType[PhoneNumberType.Mobile]} control={<Radio size="small" />} label="Mobile" />
                <FormControlLabel value={PhoneNumberType[PhoneNumberType.Home]} control={<Radio size="small" />} label="Home" />
                <FormControlLabel value={PhoneNumberType[PhoneNumberType.Work]} control={<Radio size="small" />} label="Work" />
                {/* <FormControlLabel value={PhoneNumberType[PhoneNumberType.Fax]} control={<Radio size="small" />} label="Fax" /> */}
              </RadioGroup>
            </FormControl>
          </Grid>
        </Grid>
      </form>
    </UpdateDialog>
  );
}
