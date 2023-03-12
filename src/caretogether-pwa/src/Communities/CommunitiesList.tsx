import { Button, Drawer, Fab, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Community, CreateCommunity, Permission } from '../GeneratedClient';
import { useLoadable } from '../Hooks/useLoadable';
import { useCommunityCommand, useDataInitialized, visibleCommunitiesQuery } from '../Model/DirectoryModel';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import useScreenTitle from '../Shell/ShellScreenTitle';
import AddIcon from '@mui/icons-material/Add';
import { useState } from 'react';
import { useGlobalPermissions } from '../Model/SessionModel';
import { useBackdrop } from '../Hooks/useBackdrop';

interface DrawerProps {
  onClose: () => void
}

function AddCommunity({ onClose }: DrawerProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const withBackdrop = useBackdrop();
  const navigate = useNavigate();

  const createCommunity = useCommunityCommand((communityId, name: string, description: string) => {
    const command = new CreateCommunity();
    command.communityId = communityId;
    command.name = name;
    command.description = description;
    return command;
  });

  async function save() {
    await withBackdrop(async () => {
      const communityId = crypto.randomUUID();
      await createCommunity(communityId, name, description);
      onClose();
      navigate(`/communities/community/${communityId}`);
    });
  }

  return (
    <Grid container spacing={2} maxWidth={500}>
      <Grid item xs={12}>
        <h3>Add New Community</h3>
      </Grid>
      <Grid item xs={12}>
        <TextField type='text' fullWidth required
          label="Name"
          placeholder="Enter a name for the community"
          value={name} onChange={e => setName(e.target.value)} />
      </Grid>
      <Grid item xs={12}>
        <TextField type='text' fullWidth multiline minRows={4}
          label="Description"
          placeholder="Provide a description for the community"
          value={description} onChange={e => setDescription(e.target.value)} />
      </Grid>
      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        <Button color='secondary' variant='contained'
          sx={{ marginRight: 2 }}
          onClick={onClose}>
          Cancel
        </Button>
        <Button color='primary' variant='contained'
          disabled={name.length === 0}
          onClick={save}>
          Save
        </Button>
      </Grid>
    </Grid>
  )
}

export function CommunitiesList() {
  useScreenTitle("Communities");

  const dataInitialized = useDataInitialized();

  // The array object returned by Recoil is read-only. We need to copy it before we can do an in-place sort.
  const communitiesLoadable = useLoadable(visibleCommunitiesQuery);
  const communities = (communitiesLoadable || []).map(x => x).sort((a, b) => a.name! < b.name! ? -1 : a.name! > b.name! ? 1 : 0);

  const navigate = useNavigate();
  function openCommunity(community: Community) {
    navigate(`/communities/community/${community.id}`);
  }

  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const permissions = useGlobalPermissions();

  return (!dataInitialized
    ? <ProgressBackdrop>
        <p>Loading communities...</p>
      </ProgressBackdrop>
    : <>
        <TableContainer>
          <Table aria-label="sticky table">
            <TableHead>
              <TableRow>
                <TableCell align='left' sx={{ minWidth: 200 }}>
                  Name
                </TableCell>
                <TableCell align='left' sx={{ minWidth: 400 }}>
                  Description
                </TableCell>
                <TableCell align='right' sx={{ minWidth: 50 }}>
                  Member Families
                </TableCell>
                <TableCell align='right' sx={{ minWidth: 50 }}>
                  Role Assigments
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {communities.map(community => <TableRow key={community.id}
                hover role='listitem' tabIndex={-1}
                sx={{ cursor: 'pointer' }}
                onClick={() => openCommunity(community)}>
                <TableCell align='left' sx={{ minWidth: 200 }}>
                  {community.name}
                </TableCell>
                <TableCell align='left' sx={{ minWidth: 400 }}>
                  {community.description}
                </TableCell>
                <TableCell align='right' sx={{ minWidth: 50 }}>
                  {community.memberFamilies?.length}
                </TableCell>
                <TableCell align='right' sx={{ minWidth: 50 }}>
                  {community.communityRoleAssignments?.length}
                </TableCell>
              </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {permissions(Permission.CreateCommunity) &&
          <>
            <Fab color="primary" aria-label="add"
            sx={{position: 'fixed', right: '30px', bottom: '70px'}}
            onClick={() => setAddDrawerOpen(true)}>
            <AddIcon />
          </Fab>
          <Drawer
            anchor='right'
            open={addDrawerOpen}
            onClose={() => setAddDrawerOpen(false)}
            sx={{ '.MuiDrawer-paper': { padding: 2, paddingTop: { xs: 7, sm: 8, md: 6 }}}}>
            <AddCommunity onClose={() => setAddDrawerOpen(false)} />
          </Drawer>
          </>}
      </>);
}
