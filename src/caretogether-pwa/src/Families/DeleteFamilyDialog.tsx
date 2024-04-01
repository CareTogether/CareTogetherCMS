import { useDirectoryModel, useFamilyLookup } from '../Model/DirectoryModel';
import { DialogHandle } from '../Hooks/useDialogHandle';
import { UpdateDialog } from '../Generic/UpdateDialog';
import { familyNameString } from './FamilyName';
import { useAppNavigate } from '../Hooks/useAppNavigate';

interface DeleteFamilyDialogProps {
  familyId: string,
  handle: DialogHandle
}

export function DeleteFamilyDialog({ familyId, handle }: DeleteFamilyDialogProps) {
  const directoryModel = useDirectoryModel();
  const familyLookup = useFamilyLookup();
  const appNavigate = useAppNavigate();

  const family = familyLookup(familyId);

  async function save() {
    await directoryModel.undoCreateFamily(familyId);
    appNavigate.dashboard();
  }

  return (
    <UpdateDialog title={`Are you sure you want to delete the ${familyNameString(family)}?`}
      onClose={handle.closeDialog} onSave={save}>
    </UpdateDialog>
  );
}
