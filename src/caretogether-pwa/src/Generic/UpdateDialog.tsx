import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { useBackdrop } from '../Hooks/useBackdrop';
import { handleBackdropClick } from '../Utilities/handleBackdropClick';

type UpdateDialogProps = {
  title: string;
  open?: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  enableSave?: () => boolean;
  saveLabel?: string;
  noAutoClose?: boolean;
  children?: React.ReactNode;
};

export const UpdateDialog: React.FC<UpdateDialogProps> = ({
  title,
  open,
  onClose,
  onSave,
  enableSave,
  saveLabel,
  noAutoClose = false,
  children,
}) => {
  const withBackdrop = useBackdrop();

  // Whether the dialog is open or not can be controlled by the caller; otherwise it will always be open.
  const isOpen = typeof open === 'undefined' ? true : open;

  const saveButtonLabel = typeof saveLabel === 'undefined' ? 'Save' : saveLabel;

  async function saveHandler() {
    await withBackdrop(async () => {
      await onSave();
      !noAutoClose && onClose();
    });
  }

  return (
    <Dialog
      fullWidth
      open={isOpen}
      onClose={(event, reason) => handleBackdropClick(onClose, event, reason)}
      scroll="body"
      aria-labelledby="update-dialog-title"
    >
      <DialogTitle id="update-dialog-title">{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={saveHandler}
          variant="contained"
          color="primary"
          disabled={enableSave && !enableSave()}
        >
          {saveButtonLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
