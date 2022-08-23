import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { Permission, ValueTupleOfPersonAndFamilyAdultRelationshipInfo } from '../GeneratedClient';
import { useParams } from 'react-router-dom';
import { DialogHandle, useDialogHandle } from '../Hooks/useDialogHandle';
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
import { EmailAddressEditor } from './EmailAddressEditor';
import { useFamilyIdPermissions } from '../Model/SessionModel';

interface EditAdultDialogProps {
  handle: DialogHandle
  adult: ValueTupleOfPersonAndFamilyAdultRelationshipInfo
}

export function EditAdultDialog({ handle, adult }: EditAdultDialogProps) {
  const { familyId } = useParams<{ familyId: string }>();

  const person = adult.item1!;

  const personEditorProps = { familyId, person } as PersonEditorProps;

  const deleteDialogHandle = useDialogHandle();

  const permissions = useFamilyIdPermissions(familyId!);

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
        {permissions(Permission.ViewPersonContactInfo) &&
          <>
            <h4 style={{ marginBottom:0 }}>Phone Number(s):</h4>
            {person.phoneNumbers?.map(phoneNumber =>
              <PhoneNumberEditor key={phoneNumber.id!} phoneNumber={phoneNumber} {...personEditorProps } />)}
            {permissions(Permission.EditPersonContactInfo) && <PhoneNumberEditor add {...personEditorProps} />}
            <h4 style={{ marginBottom:0 }}>Email Address(es):</h4>
            {person.emailAddresses?.map(emailAddress =>
              <EmailAddressEditor key={emailAddress.id!} emailAddress={emailAddress} {...personEditorProps } />)}
            {permissions(Permission.EditPersonContactInfo) && <EmailAddressEditor add {...personEditorProps} />}
            <h4 style={{ marginBottom:0 }}>Address(es):</h4>
            {person.addresses?.map(address =>
              <AddressEditor key={address.id!} address={address} {...personEditorProps } />)}
            {permissions(Permission.EditPersonContactInfo) && <AddressEditor add {...personEditorProps } />}
          </>}
        {permissions(Permission.ViewPersonNotes) && <NotesEditor {...personEditorProps} />}
        {permissions(Permission.ViewPersonConcerns) && <ConcernsEditor {...personEditorProps} />}
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
