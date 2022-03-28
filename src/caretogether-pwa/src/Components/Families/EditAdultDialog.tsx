import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { ValueTupleOfPersonAndFamilyAdultRelationshipInfo } from '../../GeneratedClient';
import { useParams } from 'react-router-dom';
import { DialogHandle, useDialogHandle } from '../../useDialogHandle';
import { NameEditor } from './NameEditor';
import { PersonEditorProps } from './PersonEditorProps';
import { GenderEditor } from './GenderEditor';
import { NotesEditor } from './NotesEditor';
import { ConcernsEditor } from './ConcernsEditor';
import { AgeEditor } from './AgeEditor';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { DeletePersonDialog } from './DeletePersonDialog';
import { EthnicityEditor } from './EthnicityEditor';
import { AdultFamilyRelationshipEditor } from './AdultFamilyRelationshipEditor';

interface EditAdultDialogProps {
  handle: DialogHandle
  adult: ValueTupleOfPersonAndFamilyAdultRelationshipInfo
}

// function optional(arg: string) {
//   return arg.length > 0 ? arg : null;
// }

export function EditAdultDialog({ handle, adult }: EditAdultDialogProps) {
  const { familyId } = useParams<{ familyId: string }>();

  const person = adult.item1!;

  const personEditorProps = { familyId, person } as PersonEditorProps;

  const deleteDialogHandle = useDialogHandle();

  //TODO: address(es)
  //TODO: phone number(s)
  //TODO: email address(es)


  return (
    <Dialog open={handle.open} onClose={handle.closeDialog}
      fullWidth scroll='body' aria-labelledby="edit-adult-title">
      <DialogTitle id="edit-adult-title">
        Edit Adult
      </DialogTitle>
      <DialogContent sx={{ paddingTop: '8px' }}>
        <NameEditor {...personEditorProps} />
        <GenderEditor {...personEditorProps} />
        <AgeEditor {...personEditorProps} />
        <EthnicityEditor {...personEditorProps} />
        <AdultFamilyRelationshipEditor relationship={adult.item2!} {...personEditorProps} />
        <NotesEditor {...personEditorProps} />
        <ConcernsEditor {...personEditorProps} />
        {/* 
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
                </RadioGroup>
              </FormControl>
            </Grid>
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
            <Grid item xs={12}>
              <TextField id="address-line1" label="Address Line 1" fullWidth size="small"
                value={addressLine1} onChange={e => setFields({...fields, addressLine1: e.target.value})} />
            </Grid>
            <Grid item xs={12}>
              <TextField id="address-line2" label="Address Line 2" fullWidth size="small"
                value={addressLine2} onChange={e => setFields({...fields, addressLine2: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField id="address-city" label="City" fullWidth size="small"
                value={city} onChange={e => setFields({...fields, city: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField id="address-state" label="State" fullWidth size="small"
                value={state} onChange={e => setFields({...fields, state: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField id="address-postalcode" label="ZIP/Postal Code" fullWidth size="small"
                value={postalCode} onChange={e => setFields({...fields, postalCode: e.target.value})} />
            </Grid>
          </Grid>
        </form> */}
        {/*
        {(updatePhoneParameter && <UpdatePhoneDialog familyId={partneringFamilyId} person={updatePhoneParameter.person}
          onClose={() => setUpdatePhoneParameter(null)} />) || null}
        {(updateEmailParameter && <UpdateEmailDialog familyId={partneringFamilyId} person={updateEmailParameter.person}
          onClose={() => setUpdateEmailParameter(null)} />) || null}
        {(updateAddressParameter && <UpdateAddressDialog familyId={partneringFamilyId} person={updateAddressParameter.person}
          onClose={() => setUpdateAddressParameter(null)} />) || null}
          */}
      </DialogContent>
      <DialogActions>
        <Button onClick={deleteDialogHandle.openDialog} variant="contained" color="secondary"
          startIcon={<DeleteForeverIcon />}>
          Delete
        </Button>
        <Button onClick={handle.closeDialog} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
      {deleteDialogHandle.open && <DeletePersonDialog key={deleteDialogHandle.key}
        handle={deleteDialogHandle} familyId={familyId!} person={person} />}
    </Dialog>
  );
}
