import { useRecoilValue, useSetRecoilState } from 'recoil';
import { api } from '../../Api/Api';
import { DialogHandle } from '../../Hooks/useDialogHandle';
import { UpdateDialog } from '../../Generic/UpdateDialog';
import { organizationConfigurationEdited } from '../../Model/ConfigurationModel';
import { selectedLocationContextState } from '../../Model/Data';
import { useState } from 'react';
import { Typography } from '@mui/material';

interface DeleteRoleDialogProps {
  roleName: string;
  handle: DialogHandle;
}

export function DeleteRoleDialog({ roleName, handle }: DeleteRoleDialogProps) {
  const { organizationId } = useRecoilValue(selectedLocationContextState);

  const storeEdits = useSetRecoilState(organizationConfigurationEdited);

  const [error, setError] = useState<boolean>(false);

  async function save() {
    try {
      const newConfig = await api.configuration.deleteRoleDefinition(
        organizationId,
        roleName
      );
      storeEdits(newConfig);
    } catch (error) {
      setError(true);
    }
  }

  return (
    <UpdateDialog
      title={`Are you sure you want to delete ${roleName}?`}
      onClose={handle.closeDialog}
      onSave={save}
      noAutoClose
    >
      {error && (
        <Typography color="error">
          Failed to delete role. Is it associated with a user?
        </Typography>
      )}
    </UpdateDialog>
  );
}
