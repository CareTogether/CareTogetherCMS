import { Person } from '../../GeneratedClient';
import { useDirectoryModel } from '../../Model/DirectoryModel';
import { UpdateDialog } from '../UpdateDialog';

interface DeletePersonDialogProps {
  familyId: string,
  person: Person,
  onClose: () => void
}

export function DeletePersonDialog({familyId, person, onClose}: DeletePersonDialogProps) {
  const directoryModel = useDirectoryModel();

  async function save() {
    await directoryModel.undoCreatePerson(familyId, person.id as string);
  }

  return (
    <UpdateDialog title={`Are you sure you want to delete ${person.firstName} ${person.lastName}?`} onClose={onClose}
      onSave={save}>
    </UpdateDialog>
  );
}
