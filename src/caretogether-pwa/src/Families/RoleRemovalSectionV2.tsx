import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import { useRecoilValue } from 'recoil';
import { Person, RoleRemovalReason } from '../GeneratedClient';
import { useBackdrop } from '../Hooks/useBackdrop';
import { policyData } from '../Model/ConfigurationModel';
import { useVolunteersModel } from '../Model/VolunteersModel';

type RoleRemovalSectionV2Props = {
  volunteerFamilyId: string;
  person?: Person;
  role: string;
  onCancel: () => void;
  onSuccess: () => void;
};

export function RoleRemovalSectionV2({
  volunteerFamilyId,
  person,
  role,
  onCancel,
  onSuccess,
}: RoleRemovalSectionV2Props) {
  const volunteers = useVolunteersModel();
  const withBackdrop = useBackdrop();
  const policy = useRecoilValue(policyData);
  const [reason, setReason] = useState(RoleRemovalReason.Inactive);
  const [additionalComments, setAdditionalComments] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const isFamilyRole =
    person === undefined || policy.volunteerPolicy?.volunteerFamilyRoles?.[role];
  const participantName = person
    ? `${person.firstName} ${person.lastName}`
    : 'this family';

  async function removeRole() {
    setSaving(true);
    try {
      await withBackdrop(async () => {
        if (person) {
          await volunteers.removeIndividualRole(
            volunteerFamilyId,
            person.id as string,
            role,
            reason,
            additionalComments,
            new Date(),
            null
          );
        } else {
          await volunteers.removeFamilyRole(
            volunteerFamilyId,
            role,
            reason,
            additionalComments,
            new Date(),
            null
          );
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
      <FormControl component="fieldset">
        <FormLabel component="legend">Removal reason</FormLabel>
        <RadioGroup
          aria-label="removal reason"
          name="removal-reason"
          row
          value={RoleRemovalReason[reason]}
          onChange={(event) =>
            setReason(
              RoleRemovalReason[
                event.target.value as keyof typeof RoleRemovalReason
              ]
            )
          }
        >
          <FormControlLabel
            value={RoleRemovalReason[RoleRemovalReason.Inactive]}
            control={<Radio size="small" />}
            label="Inactive"
          />
          {isFamilyRole && (
            <FormControlLabel
              value={RoleRemovalReason[RoleRemovalReason.OptOut]}
              control={<Radio size="small" />}
              label="Opted Out"
            />
          )}
          <FormControlLabel
            value={RoleRemovalReason[RoleRemovalReason.Denied]}
            control={<Radio size="small" />}
            label="Denied"
          />
        </RadioGroup>
      </FormControl>
      <TextField
        fullWidth
        label="Comments"
        multiline
        minRows={2}
        placeholder="Optional details about why this role is being removed"
        size="small"
        value={additionalComments}
        onChange={(event) => setAdditionalComments(event.target.value)}
      />
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
          {saving ? 'Removing...' : 'Remove Role'}
        </Button>
      </Stack>
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Remove this role?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will remove the {role} role from {participantName}. The role
            will no longer count as active participation.
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
            onClick={() => void removeRole()}
            variant="contained"
          >
            {saving ? 'Removing...' : 'Remove Role'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
