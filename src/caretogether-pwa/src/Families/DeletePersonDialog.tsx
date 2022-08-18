import { Person } from '../GeneratedClient';
import { useDirectoryModel } from '../Model/DirectoryModel';
import { DialogHandle } from '../Hooks/useDialogHandle';
import { UpdateDialog } from '../UpdateDialog';

interface DeletePersonDialogProps {
  familyId: string,
  person: Person,
  handle: DialogHandle
}

export function DeletePersonDialog({familyId, person, handle}: DeletePersonDialogProps) {
  const directoryModel = useDirectoryModel();

  async function save() {
    await directoryModel.undoCreatePerson(familyId, person.id as string);
  }

  return (
    <UpdateDialog title={`Are you sure you want to delete ${person.firstName} ${person.lastName}?`}
      onClose={handle.closeDialog} onSave={save}>
    </UpdateDialog>
  );
}
