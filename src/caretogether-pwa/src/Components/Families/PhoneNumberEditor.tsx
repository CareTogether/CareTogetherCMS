import { FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, TextField } from '@mui/material';
import { useDirectoryModel } from '../../Model/DirectoryModel';
import { useInlineEditor } from '../../useInlineEditor';
import { PersonEditorProps } from "./PersonEditorProps";
import { PhoneNumber, IPhoneNumber, PhoneNumberType } from '../../GeneratedClient';

type PhoneNumberEditorProps = PersonEditorProps & {
  phoneNumber: PhoneNumber
}

export function PhoneNumberEditor({ familyId, person, phoneNumber }: PhoneNumberEditorProps) {
  const directoryModel = useDirectoryModel();

  const editor = useInlineEditor(async value =>
    await directoryModel.updatePersonPhoneNumber(familyId!, person.id!,
      value.id!, value.number!, value.type!),
    phoneNumber as IPhoneNumber,
    value => (value && value.number!.length > 0 &&
      (value.number !== phoneNumber.number || value.type !== phoneNumber.type)) as boolean);

  return (
    <Grid container spacing={2}>
      {editor.editing
        ? <>
            <Grid item xs={12} sm={6}>
              <TextField id="phone-number" label="Phone Number" fullWidth size="small" type="tel"
                value={editor.value!.number!}
                onChange={e => editor.setValue({...editor.value, number: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Phone Type:</FormLabel>
                <RadioGroup aria-label="phoneType" name="phoneType" row
                  value={PhoneNumberType[editor.value!.type!]}
                  onChange={e => editor.setValue({...editor.value, type: PhoneNumberType[e.target.value as keyof typeof PhoneNumberType]})}>
                  <FormControlLabel value={PhoneNumberType[PhoneNumberType.Mobile]} control={<Radio size="small" />} label="Mobile" />
                  <FormControlLabel value={PhoneNumberType[PhoneNumberType.Home]} control={<Radio size="small" />} label="Home" />
                  <FormControlLabel value={PhoneNumberType[PhoneNumberType.Work]} control={<Radio size="small" />} label="Work" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              {editor.cancelButton}
              {editor.saveButton}
            </Grid>
          </>
        : <Grid item xs={12}>
            {phoneNumber.number} - {PhoneNumberType[phoneNumber.type!]}
            {editor.editButton}
        </Grid>}
    </Grid>
  );
}
