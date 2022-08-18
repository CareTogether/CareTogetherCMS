import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { CustodialRelationship, Permission, Person } from '../GeneratedClient';
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
import { ChildCustodyRelationshipEditor } from './ChildCustodyRelationshipEditor';
import { usePermissions } from '../Model/SessionModel';

interface EditChildDialogProps {
  handle: DialogHandle
  child: Person
  familyAdults: Person[]
  custodialRelationships?: CustodialRelationship[]
}

export function EditChildDialog({ handle, child, familyAdults, custodialRelationships }: EditChildDialogProps) {
  const { familyId } = useParams<{ familyId: string }>();

  const person = child;

  const personEditorProps = { familyId, person } as PersonEditorProps;

  const deleteDialogHandle = useDialogHandle();

  const permissions = usePermissions();
  
  return (
    <Dialog open={handle.open} onClose={handle.closeDialog}
      fullWidth scroll='body' aria-labelledby="edit-child-title">
      <DialogTitle id="edit-child-title">
        Edit Child
      </DialogTitle>
      <DialogContent sx={{ paddingTop: '8px' }}>
        <NameEditor {...personEditorProps} />
        <GenderEditor {...personEditorProps} />
        <AgeEditor {...personEditorProps} />
        <EthnicityEditor {...personEditorProps} />
        <h4 style={{ marginBottom: 0 }}>Custodial Relationships:</h4>
        {familyAdults.map(adult =>
          <ChildCustodyRelationshipEditor key={adult.id!}
            adult={adult} relationship={custodialRelationships?.find(r => r.personId === adult.id)}
            {...personEditorProps } />)}
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
