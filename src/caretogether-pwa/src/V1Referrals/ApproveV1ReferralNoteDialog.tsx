import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { V1ReferralNoteEntry, V1ReferralNoteStatus } from '../GeneratedClient';
import { useV1ReferralNotesModel } from '../Model/V1ReferralNotesModel';

type ApproveV1ReferralNoteDialogProps = {
  referralId: string;
  note: V1ReferralNoteEntry;
  onClose: () => void;
};

export function ApproveV1ReferralNoteDialog({
  referralId,
  note,
  onClose,
}: ApproveV1ReferralNoteDialogProps) {
  const { approveReferralNote } = useV1ReferralNotesModel();

  const [working, setWorking] = useState(false);
  const [contents, setContents] = useState(note.contents ?? '');
  const [accessLevel, setAccessLevel] = useState<string>(
    note.accessLevel ?? ''
  );
  const [useBackdate, setUseBackdate] = useState(false);
  const [backdatedLocal, setBackdatedLocal] = useState<string>('');

  const canApprove = note.status === V1ReferralNoteStatus.Draft;

  useEffect(() => {
    setContents(note.contents ?? '');
    setAccessLevel(note.accessLevel ?? '');
  }, [note]);

  async function onApprove() {
    if (!canApprove) return;
    if (!contents.trim()) return;

    const backdatedTimestampUtc =
      useBackdate && backdatedLocal ? new Date(backdatedLocal) : undefined;

    setWorking(true);
    try {
      await approveReferralNote(
        referralId,
        note.id,
        contents,
        backdatedTimestampUtc,
        accessLevel.trim() ? accessLevel.trim() : undefined
      );
      onClose();
    } finally {
      setWorking(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Approve note</DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {!canApprove ? (
          <Typography variant="body2">
            Only draft notes can be approved.
          </Typography>
        ) : (
          <>
            <TextField
              label="Final note contents"
              value={contents}
              onChange={(e) => setContents(e.target.value)}
              multiline
              minRows={5}
              fullWidth
              required
            />

            <TextField
              label="Access level (optional)"
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value)}
              fullWidth
              helperText="Leave blank for default access."
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={useBackdate}
                  onChange={(_, checked) => setUseBackdate(checked)}
                />
              }
              label="Backdate note?"
            />

            {useBackdate && (
              <TextField
                label="Backdated timestamp"
                type="datetime-local"
                value={backdatedLocal}
                onChange={(e) => setBackdatedLocal(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                helperText="This will be sent to the server as a Date."
              />
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={working}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onApprove}
          disabled={!canApprove || working || !contents.trim()}
        >
          {working ? 'Approving…' : 'Approve'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
