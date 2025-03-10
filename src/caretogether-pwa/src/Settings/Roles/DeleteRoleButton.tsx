import { IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDialogHandle } from '../../Hooks/useDialogHandle';
import { DeleteRoleDialog } from './DeleteRoleDialog';

interface DeleteRoleButtonProps {
  roleName: string;
}

export function DeleteRoleButton(props: DeleteRoleButtonProps) {
  const deleteDialogHandle = useDialogHandle();

  return (
    <>
      <IconButton
        onClick={(event) => {
          event.stopPropagation();
          deleteDialogHandle.openDialog();
        }}
      >
        <DeleteIcon />
      </IconButton>

      {deleteDialogHandle.open && (
        <DeleteRoleDialog
          key={deleteDialogHandle.key}
          handle={deleteDialogHandle}
          roleName={props.roleName}
        />
      )}
    </>
  );
}
