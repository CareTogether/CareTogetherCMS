import {
  Alert,
  Autocomplete,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material';
import { AddCommunityRoleAssignment, Community } from '../GeneratedClient';
import { useCommunityCommand } from '../Model/DirectoryModel';
import { useState } from 'react';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useRecoilValue } from 'recoil';
import { personNameString } from '../Families/PersonName';
import { organizationConfigurationQuery } from '../Model/ConfigurationModel';
import { visibleFamiliesQuery } from '../Model/Data';

interface DrawerProps {
  onClose: () => void;
}
interface AddRoleAssignmentFormProps extends DrawerProps {
  community: Community;
}
export function AddRoleAssignmentForm({
  community,
  onClose,
}: AddRoleAssignmentFormProps) {
  interface CandidatePerson {
    id: string;
    label: string; // Required by Autocomplete component
  }

  const [person, setPerson] = useState<CandidatePerson | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [saving, setSaving] = useState(false); // Workaround for 'duplicate' alert showing during drawer close animation

  const addRoleAssignment = useCommunityCommand((communityId) => {
    const command = new AddCommunityRoleAssignment();
    command.communityId = communityId;
    command.personId = person!.id;
    command.communityRole = role!;
    return command;
  });

  const withBackdrop = useBackdrop();

  async function save() {
    setSaving(true);
    await withBackdrop(async () => {
      await addRoleAssignment(community.id!);
      onClose();
    });
  }

  const allFamilies = useRecoilValue(visibleFamiliesQuery);
  const allAdults = allFamilies
    .flatMap((family) => family.family!.adults!.map((adult) => adult.item1!))
    .sort((a, b) => {
      const aFirst = a.firstName!;
      const aLast = a.lastName!;
      const bFirst = b.firstName!;
      const bLast = b.lastName!;

      // Sort by last name, then by first name
      return aLast < bLast
        ? -1
        : aLast > bLast
          ? 1
          : aFirst < bFirst
            ? -1
            : aFirst > bFirst
              ? 1
              : 0;
    })
    .map(
      (person) =>
        ({
          id: person.id!,
          label: personNameString(person),
        }) as CandidatePerson
    );

  const organizationConfiguration = useRecoilValue(
    organizationConfigurationQuery
  );
  const communityRoles = organizationConfiguration?.communityRoles || [];

  const duplicate =
    !saving &&
    (community.communityRoleAssignments?.find(
      (cra) => cra.personId === person?.id && cra.communityRole === role
    ) ||
      null);

  return (
    <Grid container spacing={2} maxWidth={500}>
      <Grid item xs={12}>
        <h3>Add Community Role Assignments</h3>
      </Grid>
      <Grid item xs={12}>
        <FormControl required fullWidth size="small" sx={{ marginTop: 1 }}>
          <Autocomplete
            clearOnEscape
            onChange={(_event, newValue: CandidatePerson | null) => {
              setPerson(newValue);
            }}
            options={allAdults}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                required
                {...params}
                label="Select an adult to assign to this community"
              />
            )}
          />
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormControl required>
          <FormLabel id="role">Role</FormLabel>
          <RadioGroup
            aria-labelledby="role"
            value={role || ''}
            onChange={(_event, newValue) => setRole(newValue)}
          >
            {communityRoles.map((role) => (
              <FormControlLabel
                key={role}
                value={role}
                control={<Radio />}
                label={role}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        {duplicate && (
          <Alert severity="error">
            {person?.label} already has the {role} role in this community!
          </Alert>
        )}
      </Grid>
      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        <Button
          color="secondary"
          variant="contained"
          sx={{ marginRight: 2 }}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          color="primary"
          variant="contained"
          disabled={person == null || role == null || duplicate != null}
          onClick={save}
        >
          Save
        </Button>
      </Grid>
    </Grid>
  );
}
