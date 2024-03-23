import {
  Grid,
  Button
} from "@mui/material";
import { CustodialRelationship, Permission, Person } from '../GeneratedClient';
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
import { ChildCustodyRelationshipEditor } from './ChildCustodyRelationshipEditor';
import { useFamilyIdPermissions } from '../Model/SessionModel';
import { DeletePersonDialog } from "./DeletePersonDialog";

interface EditChildDrawerProps {
  onClose: () => void;
  child: Person
  familyAdults: Person[]
  custodialRelationships?: CustodialRelationship[]
}

export function EditChildDrawer({ onClose, child, familyAdults, custodialRelationships }: EditChildDrawerProps) {
  const { familyId } = useParams<{ familyId: string }>();

  const person = child;
  
  const personEditorProps = { familyId, person } as PersonEditorProps;
  
  const deleteDialogHandle = useDialogHandle();
  
  const permissions = useFamilyIdPermissions(familyId!);

  function close() {
    onClose();
  }

  return (
    <Grid container spacing={2} maxWidth={500} sx={{ maxHeight: '100%', overflowY: 'auto' }}>
      <Grid item xs={12}>
        <h3>Edit Child</h3>
      </Grid>
      <Grid item xs={12}>
        <NameEditor {...personEditorProps} />
        <GenderEditor {...personEditorProps} />
        <AgeEditor {...personEditorProps} />
        <EthnicityEditor {...personEditorProps} />
        <h4 style={{ marginBottom: 0 }}>Custodial Relationships:</h4>
        {familyAdults.map(adult =>
          <ChildCustodyRelationshipEditor key={adult.id!}
            adult={adult} relationship={custodialRelationships?.find(r => r.personId === adult.id)}
            {...personEditorProps} />)}
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
