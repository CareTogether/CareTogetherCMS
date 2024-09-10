import { Button, Grid, TextField } from '@mui/material';
import {
  Community,
  CreateCommunity,
  EditCommunityDescription,
  RenameCommunity,
} from '../GeneratedClient';
import { useCommunityCommand } from '../Model/DirectoryModel';
import { useState } from 'react';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useAppNavigate } from '../Hooks/useAppNavigate';

interface DrawerProps {
  onClose: () => void;
}
interface AddEditCommunityDrawerProps extends DrawerProps {
  community?: Community;
}
export function AddEditCommunity({
  community,
  onClose,
}: AddEditCommunityDrawerProps) {
  const [name, setName] = useState(community?.name || '');
  const [description, setDescription] = useState(community?.description || '');

  const createCommunity = useCommunityCommand((communityId) => {
    const command = new CreateCommunity();
    command.communityId = communityId;
    command.name = name;
    command.description = description;
    return command;
  });

  const editCommunityDescription = useCommunityCommand((communityId) => {
    const command = new EditCommunityDescription();
    command.communityId = communityId;
    command.description = description;
    return command;
  });

  const renameCommunity = useCommunityCommand((communityId) => {
    const command = new RenameCommunity();
    command.communityId = communityId;
    command.name = name;
    return command;
  });

  const withBackdrop = useBackdrop();
  const appNavigate = useAppNavigate();

  async function save() {
    await withBackdrop(async () => {
      if (community) {
        if (name !== community.name) {
          await renameCommunity(community.id!);
        }
        if (description !== community.description) {
          await editCommunityDescription(community.id!);
        }
        onClose();
      } else {
        const communityId = crypto.randomUUID();
        await createCommunity(communityId);
        onClose();
        appNavigate.community(communityId);
      }
    });
  }

  return (
    <Grid container spacing={2} maxWidth={500}>
      <Grid item xs={12}>
        <h3>{community ? 'Edit Community' : 'Add New Community'}</h3>
      </Grid>
      <Grid item xs={12}>
        <TextField
          type="text"
          fullWidth
          required
          label="Name"
          placeholder="Enter a name for the community"
          error={name.length === 0}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          type="text"
          fullWidth
          multiline
          minRows={4}
          label="Description"
          placeholder="Provide a description for the community"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
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
          disabled={
            (community &&
              name === community.name &&
              description === community.description) ||
            name.length === 0
          }
          onClick={save}
        >
          Save
        </Button>
      </Grid>
    </Grid>
  );
}
