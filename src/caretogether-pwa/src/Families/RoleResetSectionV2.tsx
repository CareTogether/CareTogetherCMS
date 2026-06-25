import { Box, Button, Stack, Typography } from '@mui/material';
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
  const [saving, setSaving] = useState(false);

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
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack spacing={1.5}>
      <Typography color="text.secondary" variant="body2">
        Reset participation for{' '}
        <Box component="span" className="ph-unmask">
          {person ? `${person.firstName} ${person.lastName}` : 'this family'}
        </Box>{' '}
        in the {role} role.
      </Typography>
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
          disabled={saving}
          onClick={() => void resetParticipation()}
          variant="contained"
        >
          {saving ? 'Resetting...' : 'Reset Participation'}
        </Button>
      </Stack>
    </Stack>
  );
}
