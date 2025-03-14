import { IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDialogHandle } from '../../Hooks/useDialogHandle';
import { DeleteRoleDialog } from './DeleteRoleDialog';

interface DeleteRoleButtonProps {
  roleName: string;
  disabled?: boolean;
}

export function DeleteRoleButton({
  roleName,
  disabled = false,
}: DeleteRoleButtonProps) {
  const deleteDialogHandle = useDialogHandle();

  return (
    <>
      <IconButton
        onClick={(event) => {
          event.stopPropagation();
          deleteDialogHandle.openDialog();
        }}
        title="Delete role"
        disabled={disabled}
      >
        <DeleteIcon />
      </IconButton>

      {deleteDialogHandle.open && (
        <DeleteRoleDialog
          key={deleteDialogHandle.key}
          handle={deleteDialogHandle}
          roleName={roleName}
        />
      )}
    </>
  );
}
