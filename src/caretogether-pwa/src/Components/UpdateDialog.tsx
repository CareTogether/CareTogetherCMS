import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useBackdrop } from './RequestBackdrop';

type UpdateDialogProps = {
  title: string
  open?: boolean
  onClose: () => void
  onSave: () => Promise<void>
  enableSave?: () => boolean
  saveLabel?: string
}

export const UpdateDialog: React.FC<UpdateDialogProps> = ({
  title,
  open,
  onClose,
  onSave,
  enableSave,
  saveLabel,
  children,
}) => {
  const withBackdrop = useBackdrop();

  // Whether the dialog is open or not can be controlled by the caller; otherwise it will always be open.
  const isOpen = typeof(open) === 'undefined' ? true : open;
  
  const saveButtonLabel = typeof(saveLabel) === 'undefined' ? "Save" : saveLabel;
  
  async function saveHandler() {
    await withBackdrop(async () => {
      await onSave();
      onClose();
    });
  }
  return (
    <Dialog fullWidth open={isOpen} onClose={onClose} scroll='body' aria-labelledby="update-dialog-title">
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
          {saveButtonLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
