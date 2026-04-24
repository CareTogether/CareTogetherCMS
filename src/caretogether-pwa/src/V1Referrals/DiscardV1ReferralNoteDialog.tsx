import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { V1ReferralNoteEntry, V1ReferralNoteStatus } from '../GeneratedClient';
import { useV1ReferralNotesModel } from '../Model/V1ReferralNotesModel';

type DiscardV1ReferralNoteDialogProps = {
  referralId: string;
  note: V1ReferralNoteEntry;
  onClose: () => void;
};

export function DiscardV1ReferralNoteDialog({
  referralId,
  note,
  onClose,
}: DiscardV1ReferralNoteDialogProps) {
  const { discardDraftReferralNote } = useV1ReferralNotesModel();
  const [working, setWorking] = useState(false);

  const canDiscard = note.status === V1ReferralNoteStatus.Draft;

  async function onDelete() {
    if (!canDiscard) return;

    setWorking(true);
    try {
      await discardDraftReferralNote(referralId, note.id);
      onClose();
    } finally {
      setWorking(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Delete draft note?</DialogTitle>

      <DialogContent>
        {!canDiscard ? (
          <Typography variant="body2">
            Only draft notes can be deleted.
          </Typography>
        ) : (
          <Typography variant="body2">
            This will permanently delete this draft note.
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={working}>
          Cancel
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={onDelete}
          disabled={!canDiscard || working}
        >
          {working ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
