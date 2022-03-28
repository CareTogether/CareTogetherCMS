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
import { AddressEditor } from './AddressEditor';
import { PhoneNumberEditor } from './PhoneNumberEditor';

interface EditAdultDialogProps {
  handle: DialogHandle
  adult: ValueTupleOfPersonAndFamilyAdultRelationshipInfo
}

export function EditAdultDialog({ handle, adult }: EditAdultDialogProps) {
  const { familyId } = useParams<{ familyId: string }>();

  const person = adult.item1!;

  const personEditorProps = { familyId, person } as PersonEditorProps;

  const deleteDialogHandle = useDialogHandle();

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
        Phone Numbers:
        {person.phoneNumbers?.map(phoneNumber =>
          <PhoneNumberEditor key={phoneNumber.id!} phoneNumber={phoneNumber} {...personEditorProps } />)}
        {/* {person.emailAddresses?.map(emailAddress =>
          <EmailAddressEditor key={emailAddress.id!} emailAddress={emailAddress} {...personEditorProps } />)} */}
        Addresses:
        {person.addresses?.map(address =>
          <AddressEditor key={address.id!} address={address} {...personEditorProps } />)}
        <NotesEditor {...personEditorProps} />
        <ConcernsEditor {...personEditorProps} />
        {/* 
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
        </form> */}
        {/*
        {(updatePhoneParameter && <UpdatePhoneDialog familyId={partneringFamilyId} person={updatePhoneParameter.person}
          onClose={() => setUpdatePhoneParameter(null)} />) || null}
        {(updateEmailParameter && <UpdateEmailDialog familyId={partneringFamilyId} person={updateEmailParameter.person}
          onClose={() => setUpdateEmailParameter(null)} />) || null}
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
