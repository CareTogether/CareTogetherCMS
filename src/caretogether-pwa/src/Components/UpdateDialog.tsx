import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useBackdrop } from './RequestBackdrop';

type UpdateDialogProps = {
  title: string,
  onClose: () => void,
  onSave: () => Promise<void>,
  enableSave?: () => boolean
}

export const UpdateDialog: React.FC<UpdateDialogProps> = ({
  title,
  onClose,
  onSave,
  enableSave,
  children,
}) => {
  const withBackdrop = useBackdrop();
  
  async function saveHandler() {
    await withBackdrop(async () => {
      await onSave();
      onClose();
    });
  }
  return (
    <Dialog fullWidth open={true} onClose={onClose} scroll='body' aria-labelledby="update-dialog-title">
      <DialogTitle id="update-dialog-title">
        {title}
      </DialogTitle>
      <DialogContent>
        {children}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={saveHandler} variant="contained" color="primary"
          disabled={enableSave && !enableSave()}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
