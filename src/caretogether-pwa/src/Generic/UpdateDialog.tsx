import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { useRef, useState } from 'react';
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
  const submitting = useRef(false);
  const [saving, setSaving] = useState(false);

  // Whether the dialog is open or not can be controlled by the caller; otherwise it will always be open.
  const isOpen = typeof open === 'undefined' ? true : open;

  const saveButtonLabel = typeof saveLabel === 'undefined' ? 'Save' : saveLabel;

  async function saveHandler() {
    if (submitting.current || (enableSave && !enableSave())) return;
    submitting.current = true;
    setSaving(true);
    try {
      await withBackdrop(async () => {
        await onSave();
        if (!noAutoClose) onClose();
      });
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <Dialog
      fullWidth
      open={isOpen}
      onClose={(event, reason) => {
        if (!submitting.current) handleBackdropClick(onClose, event, reason);
      }}
      scroll="body"
      aria-labelledby="update-dialog-title"
    >
      <DialogTitle id="update-dialog-title">{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary" disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={saveHandler}
          variant="contained"
          color="primary"
          disabled={saving || (enableSave && !enableSave())}
        >
          {saveButtonLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
