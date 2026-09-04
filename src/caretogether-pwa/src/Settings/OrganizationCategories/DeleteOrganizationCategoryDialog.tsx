import { useState } from 'react';
import { Alert, Typography } from '@mui/material';
import { useSetAtom } from 'jotai';
import { OrganizationCategory } from '../../GeneratedClient';
import { api } from '../../Api/Api';
import { UpdateDialog } from '../../Generic/UpdateDialog';
import { organizationConfigurationEdited } from '../../Model/ConfigurationModel';
import { useRequiredSelectedLocationContext } from '../../Model/Data';

type DeleteOrganizationCategoryDialogProps = {
  category: OrganizationCategory;
  onClose: () => void;
};

export function DeleteOrganizationCategoryDialog({
  category,
  onClose,
}: DeleteOrganizationCategoryDialogProps) {
  const [deleteFailed, setDeleteFailed] = useState(false);
  const { organizationId } = useRequiredSelectedLocationContext();
  const storeEdits = useSetAtom(organizationConfigurationEdited);

  async function deleteCategory() {
    setDeleteFailed(false);
    try {
      const updatedConfiguration =
        await api.configuration.deleteOrganizationCategory(
          organizationId,
          category.id!
        );
      storeEdits(updatedConfiguration);
      onClose();
    } catch {
      setDeleteFailed(true);
    }
  }

  return (
    <UpdateDialog
      title="Delete Organization category?"
      saveLabel="Delete"
      noAutoClose
      onClose={onClose}
      onSave={deleteCategory}
    >
      <Typography sx={{ mb: deleteFailed ? 2 : 0 }}>
        Delete <strong>{category.name}</strong>? This cannot be undone.
      </Typography>
      {deleteFailed && (
        <Alert severity="error">
          This category could not be deleted. Remove it from every Organization
          before trying again.
        </Alert>
      )}
    </UpdateDialog>
  );
}
