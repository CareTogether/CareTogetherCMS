import { useState } from 'react';
import { FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, TextField } from '@material-ui/core';
import { Person, PhoneNumberType } from '../../GeneratedClient';
import { useDirectoryModel } from '../../Model/DirectoryModel';
import { UpdateDialog } from '../UpdateDialog';

interface UpdatePhoneDialogProps {
  familyId: string,
  person: Person,
  onClose: () => void
}

export function UpdatePhoneDialog({familyId, person, onClose}: UpdatePhoneDialogProps) {
  const directoryModel = useDirectoryModel();
  const currentPhoneNumber = person.phoneNumbers?.find(x => x.id === person.preferredPhoneNumberId);
  const [fields, setFields] = useState({
    phoneNumber: currentPhoneNumber?.number || "",
    phoneType: currentPhoneNumber?.type || PhoneNumberType.Mobile
  });
  const { phoneNumber, phoneType } = fields;

  async function save() {
    if (currentPhoneNumber)
      await directoryModel.updatePersonPhoneNumber(familyId, person.id as string,
        currentPhoneNumber.id!, phoneNumber, phoneType);
    else
      await directoryModel.addPersonPhoneNumber(familyId, person.id as string,
        phoneNumber, phoneType);
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
