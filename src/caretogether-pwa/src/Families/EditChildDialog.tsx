import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  CustodialRelationship,
  ExactAge,
  FamilyAdultRelationshipInfo,
  Permission,
  Person,
} from '../GeneratedClient';
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
import { useFamilyIdPermissions } from '../Model/SessionModel';
import { isBackdropClick } from '../Utilities/handleBackdropClick';
import { differenceInYears } from 'date-fns';
import { EmojiPeople } from '@mui/icons-material';
import { useDirectoryModel } from '../Model/DirectoryModel';
import { personNameString } from './PersonName';
import { useBackdrop } from '../Hooks/useBackdrop';

interface EditChildDialogProps {
  handle: DialogHandle;
  child: Person;
  familyAdults: Person[];
  custodialRelationships?: CustodialRelationship[];
}

export function EditChildDialog({
  handle,
  child,
  familyAdults,
  custodialRelationships,
}: EditChildDialogProps) {
  const { familyId } = useParams<{ familyId: string }>();

  const person = child;

  const isAdult =
    child?.age &&
    differenceInYears(new Date(), (child.age as ExactAge).dateOfBirth!) >= 18;

  const personEditorProps = { familyId, person } as PersonEditorProps;

  const deleteDialogHandle = useDialogHandle();

  const permissions = useFamilyIdPermissions(familyId!);

  const directoryModel = useDirectoryModel();
  const withBackdrop = useBackdrop();

  const handleConvertToAdult = async () => {
    const confirmConversion = window.confirm(
      `Are you sure you want to convert ${personNameString(child)} to an adult?`
    );
    if (confirmConversion) {
      await withBackdrop(async () => {
        handle.closeDialog();
        const newFamilyAdultRelationshipInfo =
          new FamilyAdultRelationshipInfo();
        newFamilyAdultRelationshipInfo.isInHousehold = true;
        newFamilyAdultRelationshipInfo.relationshipToFamily = 'Adult Child';
        await directoryModel.convertChildToAdult(
          familyId!,
          child.id!,
          newFamilyAdultRelationshipInfo
        );
      });
    }
  };

  return (
    <Dialog
      open={handle.open}
      onClose={(event: object | undefined, reason: string) =>
        !isBackdropClick(reason) ? handle.closeDialog : {}
      }
      fullWidth
      scroll="body"
      aria-labelledby="edit-child-title"
    >
      <DialogTitle id="edit-child-title">Edit Child</DialogTitle>
      <DialogContent sx={{ paddingTop: '8px' }}>
        <NameEditor {...personEditorProps} />
        <GenderEditor {...personEditorProps} />
        <AgeEditor {...personEditorProps} />
        {isAdult && (
          <>
            <Chip size="medium" label={'No longer under 18!'} color="error" />
            <Button
              onClick={handleConvertToAdult}
              variant="contained"
              color="primary"
              size="medium"
              sx={{ marginLeft: 2 }}
              startIcon={<EmojiPeople />}
            >
              Convert to Adult
            </Button>
          </>
        )}
        <EthnicityEditor {...personEditorProps} />
        <h4 style={{ marginBottom: 0 }}>Custodial Relationships:</h4>
        {familyAdults.map((adult) => (
          <ChildCustodyRelationshipEditor
            key={adult.id!}
            adult={adult}
            relationship={custodialRelationships?.find(
              (r) => r.personId === adult.id
            )}
            {...personEditorProps}
          />
        ))}
        {permissions(Permission.ViewPersonNotes) && (
          <NotesEditor {...personEditorProps} />
        )}
        {permissions(Permission.ViewPersonConcerns) && (
          <ConcernsEditor {...personEditorProps} />
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={deleteDialogHandle.openDialog}
          variant="contained"
          color="secondary"
          startIcon={<DeleteForeverIcon />}
        >
          Delete
        </Button>
        <Button
          onClick={handle.closeDialog}
          variant="contained"
          color="primary"
        >
          Close
        </Button>
      </DialogActions>
      {deleteDialogHandle.open && (
        <DeletePersonDialog
          key={deleteDialogHandle.key}
          handle={deleteDialogHandle}
          familyId={familyId!}
          person={person}
        />
      )}
    </Dialog>
  );
}
