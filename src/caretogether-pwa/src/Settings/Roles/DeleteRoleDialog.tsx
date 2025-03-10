import { useRecoilValue, useSetRecoilState } from 'recoil';
import { api } from '../../Api/Api';
import { DialogHandle } from '../../Hooks/useDialogHandle';
import { UpdateDialog } from '../../Generic/UpdateDialog';
import { organizationConfigurationEdited } from '../../Model/ConfigurationModel';
import { selectedLocationContextState } from '../../Model/Data';

interface DeletePersonDialogProps {
  roleName: string;
  handle: DialogHandle;
}

export function DeleteRoleDialog({
  roleName,
  handle,
}: DeletePersonDialogProps) {
  const { organizationId } = useRecoilValue(selectedLocationContextState);

  const storeEdits = useSetRecoilState(organizationConfigurationEdited);

  async function save() {
    const newConfig = await api.configuration.removeRoleDefinition(
      organizationId,
      roleName
    );
    storeEdits(newConfig);
  }

  return (
    <UpdateDialog
      title={`Are you sure you want to delete ${roleName}?`}
      onClose={handle.closeDialog}
      onSave={save}
    ></UpdateDialog>
  );
}
