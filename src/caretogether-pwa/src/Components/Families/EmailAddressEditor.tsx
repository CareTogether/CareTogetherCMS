import { FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, TextField } from '@mui/material';
import { useDirectoryModel } from '../../Model/DirectoryModel';
import { useInlineEditor } from '../../useInlineEditor';
import { PersonEditorProps } from "./PersonEditorProps";
import { EmailAddress, IEmailAddress, EmailAddressType } from '../../GeneratedClient';

type EmailAddressEditorProps = PersonEditorProps & {
  emailAddress: EmailAddress
}

export function EmailAddressEditor({ familyId, person, emailAddress }: EmailAddressEditorProps) {
  const directoryModel = useDirectoryModel();

  const editor = useInlineEditor(async value =>
    await directoryModel.updatePersonEmailAddress(familyId!, person.id!,
      value.id!, value.address!, value.type!),
    emailAddress as IEmailAddress,
    value => (value && value.address!.length > 0 &&
      (value.address !== emailAddress.address || value.type !== emailAddress.type)) as boolean);

  return (
    <Grid container spacing={2}>
      {editor.editing
        ? <>
            <Grid item xs={12} sm={6}>
              <TextField id="email-address" label="Email Address" fullWidth size="small" type="email"
                value={editor.value!.address!}
                onChange={e => editor.setValue({...editor.value, address: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Email Type:</FormLabel>
                <RadioGroup aria-label="emailType" name="emailType" row
                  value={EmailAddressType[editor.value!.type!]}
                  onChange={e => editor.setValue({...editor.value, type: EmailAddressType[e.target.value as keyof typeof EmailAddressType]})}>
                  <FormControlLabel value={EmailAddressType[EmailAddressType.Personal]} control={<Radio size="small" />} label="Personal" />
                  <FormControlLabel value={EmailAddressType[EmailAddressType.Work]} control={<Radio size="small" />} label="Work" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              {editor.cancelButton}
              {editor.saveButton}
            </Grid>
          </>
        : <Grid item xs={12}>
            {emailAddress.address} - {EmailAddressType[emailAddress.type!]}
            {editor.editButton}
        </Grid>}
    </Grid>
  );
}
