import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';

type ApprovalWorkflowConfirmationSectionV2Props = {
  title: string;
  description: string;
  buttonLabel: string;
  confirmationTitle: string;
  confirmationDescription: string;
  disabled?: boolean;
  loading?: boolean;
  onConfirm: () => Promise<void>;
};

export function ApprovalWorkflowConfirmationSectionV2({
  title,
  description,
  buttonLabel,
  confirmationTitle,
  confirmationDescription,
  disabled,
  loading,
  onConfirm,
}: ApprovalWorkflowConfirmationSectionV2Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function confirmAction() {
    await onConfirm();
    setConfirmOpen(false);
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">{title}</Typography>
      <Typography color="text.secondary" variant="body2">
        {description}
      </Typography>
      <Button
        aria-busy={loading}
        color="error"
        disabled={disabled || loading}
        onClick={() => setConfirmOpen(true)}
        variant="contained"
      >
        {loading ? 'Working...' : buttonLabel}
      </Button>
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{confirmationTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmationDescription}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={loading} onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            aria-busy={loading}
            color="error"
            disabled={loading}
            onClick={() => void confirmAction()}
            variant="contained"
          >
            {loading ? 'Working...' : buttonLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
