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
import { Person, RoleRemoval, RoleRemovalReason } from '../GeneratedClient';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useVolunteersModel } from '../Model/VolunteersModel';

type RoleResetSectionV2Props = {
  volunteerFamilyId: string;
  person?: Person;
  role: string;
  roleRemoval: RoleRemoval;
  onCancel: () => void;
  onSuccess: () => void;
};

export function RoleResetSectionV2({
  volunteerFamilyId,
  person,
  role,
  roleRemoval,
  onCancel,
  onSuccess,
}: RoleResetSectionV2Props) {
  const volunteers = useVolunteersModel();
  const withBackdrop = useBackdrop();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const participantName = person
    ? `${person.firstName} ${person.lastName}`
    : 'this family';

  async function resetParticipation() {
    setSaving(true);
    try {
      await withBackdrop(async () => {
        if (person) {
          await volunteers.resetIndividualRole(
            volunteerFamilyId,
            person.id as string,
            role,
            null,
            null
          );
        } else {
          await volunteers.resetFamilyRole(volunteerFamilyId, role, null, null);
        }

        onSuccess();
      });
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack spacing={1.5}>
      <Typography color="text.secondary" variant="body2">
        Current removal reason: {RoleRemovalReason[roleRemoval.reason!]}
        {roleRemoval.additionalComments
          ? `. Comments: ${roleRemoval.additionalComments}`
          : ''}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
        <Button disabled={saving} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          aria-busy={saving}
          color="error"
          disabled={saving}
          onClick={() => setConfirmOpen(true)}
          variant="contained"
        >
          {saving ? 'Resetting...' : 'Reset Participation'}
        </Button>
      </Stack>
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Reset participation?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will restore the {role} role for {participantName} and remove
            the current participation removal.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            aria-busy={saving}
            color="error"
            disabled={saving}
            onClick={() => void resetParticipation()}
            variant="contained"
          >
            {saving ? 'Resetting...' : 'Reset Participation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
