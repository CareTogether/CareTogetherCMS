import {
  Grid,
  Button
} from "@mui/material";
import { Permission, ValueTupleOfPersonAndFamilyAdultRelationshipInfo } from '../GeneratedClient';
import { useParams } from 'react-router-dom';
import { useDialogHandle } from '../Hooks/useDialogHandle';
import { NameEditor } from './NameEditor';
import { PersonEditorProps } from './PersonEditorProps';
import { GenderEditor } from './GenderEditor';
import { NotesEditor } from './NotesEditor';
import { ConcernsEditor } from './ConcernsEditor';
import { AgeEditor } from './AgeEditor';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { EthnicityEditor } from './EthnicityEditor';
import { AdultFamilyRelationshipEditor } from './AdultFamilyRelationshipEditor';
import { AddressEditor } from './AddressEditor';
import { PhoneNumberEditor } from './PhoneNumberEditor';
import { EmailAddressEditor } from './EmailAddressEditor';
import { useFamilyIdPermissions } from '../Model/SessionModel';
import { DeletePersonDialog } from "./DeletePersonDialog";

interface EditAdultDrawerProps {
  onClose: () => void;
  adult: ValueTupleOfPersonAndFamilyAdultRelationshipInfo;
}

export function EditAdultDrawer({ onClose, adult }: EditAdultDrawerProps) {
  const { familyId } = useParams<{ familyId: string }>();

  const person = adult.item1!;

  const personEditorProps = { familyId, person } as PersonEditorProps;

  const deleteDialogHandle = useDialogHandle();

  const permissions = useFamilyIdPermissions(familyId!);  

  function close() {
    onClose();
  }

  return (
    <Grid container spacing={2} maxWidth={500} sx={{ maxHeight: '100%', overflowY: 'auto' }}>
      <Grid item xs={12}>
        <h3>Edit Adult</h3>
      </Grid>
      <Grid item xs={12}>
		<NameEditor {...personEditorProps} />
        <GenderEditor {...personEditorProps} />
        <AgeEditor {...personEditorProps} />
        <EthnicityEditor {...personEditorProps} />
        <AdultFamilyRelationshipEditor relationship={adult.item2!} {...personEditorProps} />
        {permissions(Permission.ViewPersonContactInfo) &&
          <>
            <h4 style={{ marginBottom: 0 }}>Phone Number(s):</h4>
            {person.phoneNumbers?.map(phoneNumber =>
              <PhoneNumberEditor key={phoneNumber.id!} phoneNumber={phoneNumber} {...personEditorProps} />)}
            {permissions(Permission.EditPersonContactInfo) && <PhoneNumberEditor add {...personEditorProps} />}
            <h4 style={{ marginBottom: 0 }}>Email Address(es):</h4>
            {person.emailAddresses?.map(emailAddress =>
              <EmailAddressEditor key={emailAddress.id!} emailAddress={emailAddress} {...personEditorProps} />)}
            {permissions(Permission.EditPersonContactInfo) && <EmailAddressEditor add {...personEditorProps} />}
            <h4 style={{ marginBottom: 0 }}>Address(es):</h4>
            {person.addresses?.map(address =>
              <AddressEditor key={address.id!} address={address} {...personEditorProps} />)}
            {permissions(Permission.EditPersonContactInfo) && <AddressEditor add {...personEditorProps} />}
          </>}
        {permissions(Permission.ViewPersonNotes) && <NotesEditor {...personEditorProps} />}
        {permissions(Permission.ViewPersonConcerns) && <ConcernsEditor {...personEditorProps} />}
      </Grid>
      <Grid item xs={12} sx={{ textAlign: 'right', paddingBottom: '.25rem' }}>
        <Button onClick={deleteDialogHandle.openDialog} variant="contained" color="secondary" sx={{ marginRight: 2 }}
          startIcon={<DeleteForeverIcon />}>
          Delete
        </Button>
        <Button color='primary' variant='contained'
          onClick={close}>
          Close
        </Button>        
      </Grid>
      {deleteDialogHandle.open && <DeletePersonDialog key={deleteDialogHandle.key}
        handle={deleteDialogHandle} familyId={familyId!} person={person} />}
    </Grid>
  );
}
