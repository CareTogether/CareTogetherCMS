import { useMemo, useState } from 'react';
import {
  Autocomplete,
  Button,
  FormControl,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { AddCommunityMemberFamily, CommunityInfo } from '../GeneratedClient';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useCommunityCommand } from '../Model/DirectoryModel';

type AddFamilyCommunitiesFormV2Props = {
  candidateCommunities: CommunityInfo[];
  familyId: string;
  onClose: () => void;
};

type CandidateCommunity = {
  id: string;
  label: string;
};

export function AddFamilyCommunitiesFormV2({
  candidateCommunities,
  familyId,
  onClose,
}: AddFamilyCommunitiesFormV2Props) {
  const [selectedCommunities, setSelectedCommunities] = useState<
    CandidateCommunity[]
  >([]);
  const addMemberFamily = useCommunityCommand(
    (communityId, selectedFamilyId: string) => {
      const command = new AddCommunityMemberFamily();
      command.communityId = communityId;
      command.familyId = selectedFamilyId;
      return command;
    }
  );
  const withBackdrop = useBackdrop();

  const communityOptions = useMemo(
    () =>
      candidateCommunities
        .map((communityInfo) => ({
          id: communityInfo.community!.id!,
          label: communityInfo.community!.name!,
        }))
        .sort((a, b) =>
          a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
        ),
    [candidateCommunities]
  );

  async function save() {
    await withBackdrop(async () => {
      for (const community of selectedCommunities) {
        await addMemberFamily(community.id, familyId);
      }

      onClose();
    });
  }

  return (
    <Grid container spacing={2} sx={{ maxWidth: 500 }}>
      <Grid size={12}>
        <Typography className="ph-unmask" variant="h6">
          Add Organizations
        </Typography>
      </Grid>
      <Grid size={12}>
        {communityOptions.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            There are no organizations available to add.
          </Typography>
        ) : (
          <FormControl required fullWidth size="small" sx={{ mt: 1 }}>
            <Autocomplete
              multiple
              clearOnEscape
              disableCloseOnSelect
              value={selectedCommunities}
              options={communityOptions}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_event, newValue: CandidateCommunity[]) => {
                setSelectedCommunities(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  required
                  {...params}
                  label="Select organizations to add"
                />
              )}
            />
          </FormControl>
        )}
      </Grid>
      <Grid
        size={12}
        sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}
      >
        <Button color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          color="primary"
          disabled={selectedCommunities.length === 0}
          onClick={save}
          variant="contained"
        >
          Add
        </Button>
      </Grid>
    </Grid>
  );
}
