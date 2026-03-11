import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { V1ReferralNoteEntry, V1ReferralNoteStatus } from '../GeneratedClient';
import { useV1ReferralNotesModel } from '../Model/V1ReferralNotesModel';

type AddEditV1ReferralNoteDialogProps = {
  referralId: string;
  note?: V1ReferralNoteEntry;
  onClose: () => void;
};

export function AddEditV1ReferralNoteDialog({
  referralId,
  note,
  onClose,
}: AddEditV1ReferralNoteDialogProps) {
  const { createDraftReferralNote, editDraftReferralNote } =
    useV1ReferralNotesModel();

  const isEdit = !!note;

  const [contents, setContents] = useState('');
  const [accessLevel, setAccessLevel] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setContents(note?.contents ?? '');
    setAccessLevel(note?.accessLevel ?? '');
  }, [note]);

  const disabled =
    saving ||
    contents.trim().length === 0 ||
    (isEdit && note?.status !== V1ReferralNoteStatus.Draft);

  const dialogTitle = useMemo(() => {
    if (!isEdit) return 'Add referral note';
    return 'Edit referral note';
  }, [isEdit]);

  async function onSave() {
    if (contents.trim().length === 0) return;

    setSaving(true);
    try {
      const noteId = isEdit ? note!.id : crypto.randomUUID();

      if (isEdit) {
        await editDraftReferralNote(
          referralId,
          noteId,
          contents,
          undefined,
          accessLevel.trim() === '' ? undefined : accessLevel.trim()
        );
      } else {
        await createDraftReferralNote(
          referralId,
          noteId,
          contents,
          undefined,
          accessLevel.trim() === '' ? undefined : accessLevel.trim()
        );
      }

      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{dialogTitle}</DialogTitle>

      <DialogContent>
        {isEdit && note?.status !== V1ReferralNoteStatus.Draft && (
          <Box sx={{ mb: 2, fontSize: 13 }}>
            Only draft notes can be edited.
          </Box>
        )}

        <TextField
          label="Note"
          value={contents}
          onChange={(e) => setContents(e.target.value)}
          fullWidth
          multiline
          minRows={6}
          margin="normal"
        />

        <TextField
          label="Access level (optional)"
          value={accessLevel}
          onChange={(e) => setAccessLevel(e.target.value)}
          fullWidth
          margin="normal"
          placeholder="Leave blank for default"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSave} disabled={disabled}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
