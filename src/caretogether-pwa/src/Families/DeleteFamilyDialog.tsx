import { useDirectoryModel, useFamilyLookup } from '../Model/DirectoryModel';
import { DialogHandle } from '../Hooks/useDialogHandle';
import { UpdateDialog } from '../Generic/UpdateDialog';
import { familyNameString } from './FamilyName';
import waldoUrl from '../Engagement/waldo.png';
import { useAppNavigate } from '../Hooks/useAppNavigate';

interface DeleteFamilyDialogProps {
  familyId: string;
  handle: DialogHandle;
}

export function DeleteFamilyDialog({
  familyId,
  handle,
}: DeleteFamilyDialogProps) {
  const directoryModel = useDirectoryModel();
  const familyLookup = useFamilyLookup();
  const appNavigate = useAppNavigate();

  const family = familyLookup(familyId);

  async function save() {
    appNavigate.dashboard();
    await directoryModel.undoCreateFamily(familyId);
  }

  return (
    <UpdateDialog
      title={`Are you sure you want to delete the ${familyNameString(family)}?`}
      onClose={handle.closeDialog}
      onSave={save}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <img
          src={waldoUrl}
          alt="Waldo"
          style={{ width: '15%', position: 'absolute', bottom: 0, left: '25%' }}
        />
      </div>
    </UpdateDialog>
  );
}
