import { Button, Container, Drawer, Grid, List, ListItem, ListItemButton, ListItemIcon, ListItemText, TextField, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { familyNameString } from '../Families/FamilyName';
import { personNameString } from '../Families/PersonName';
import { CombinedFamilyInfo, Community, CreateCommunity, EditCommunityDescription, Permission, RenameCommunity } from '../GeneratedClient';
import { useCommunityCommand, useCommunityLookup, useDataInitialized, usePersonAndFamilyLookup, useUserLookup, visibleFamiliesQuery } from '../Model/DirectoryModel';
import { useCommunityPermissions } from '../Model/SessionModel';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import useScreenTitle from '../Shell/ShellScreenTitle';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EditIcon from '@mui/icons-material/Edit';
import { useState } from 'react';
import { useBackdrop } from '../Hooks/useBackdrop';
import { format } from 'date-fns';

interface DrawerProps {
  onClose: () => void
}

interface AddEditCommunityDrawerProps extends DrawerProps {
  community?: Community
}

function AddEditCommunity({ community, onClose }: AddEditCommunityDrawerProps) {
  const [name, setName] = useState(community?.name || "");
  const [description, setDescription] = useState(community?.description || "");

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
  const navigate = useNavigate();

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
        navigate(`/communities/community/${communityId}`);
      }
    });
  }

  return (
    <Grid container spacing={2} maxWidth={500}>
      <Grid item xs={12}>
        <h3>
          { community
            ? "Edit Community"
            : "Add New Community"}
        </h3>
      </Grid>
      <Grid item xs={12}>
        <TextField type='text' fullWidth required
          label="Name"
          placeholder="Enter a name for the community"
          error={name.length === 0}
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
          disabled={(community && name === community.name && description === community.description) ||
            name.length === 0}
          onClick={save}>
          Save
        </Button>
      </Grid>
    </Grid>
  )
}

export function CommunityScreen() {
  const communityIdMaybe = useParams<{ communityId: string; }>();
  const communityId = communityIdMaybe.communityId as string;

  const dataInitialized = useDataInitialized();

  const communityLookup = useCommunityLookup();
  const communityInfo = communityLookup(communityId)!;
  const community = communityInfo?.community;

  const userLookup = useUserLookup();
  const documents = (community?.uploadedDocuments || []).map(document => ({
    uploader: userLookup(document.userId),
    document: document
  }));
  
  const personLookup = usePersonAndFamilyLookup();
  const assignees = (community?.communityRoleAssignments || []).map(assignee => ({
    personAndFamily: personLookup(assignee.personId),
    communityRole: assignee.communityRole
  }));

  const visibleFamilies = useRecoilValue(visibleFamiliesQuery);

  const memberFamilies = (community?.memberFamilies || []).map(familyId =>
    visibleFamilies.find(family => family.family?.id === familyId)).filter(family => family) as CombinedFamilyInfo[];

  useScreenTitle(community?.name || "...");

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
  // const isWideScreen = useMediaQuery(theme.breakpoints.up('xl'));

  // const policy = useRecoilValue(policyData);
  const permissions = useCommunityPermissions(communityInfo);

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  
  return ((!dataInitialized || !community)
    ? <ProgressBackdrop>
        <p>Loading community...</p>
      </ProgressBackdrop>
    : <Container maxWidth={false} sx={{ paddingLeft: '12px' }}>
        <Toolbar disableGutters variant={isDesktop ? 'dense' : 'regular'}>
          {permissions(Permission.UploadCommunityDocuments) && <Button
            // onClick={() => setUploadDocumentDialogOpen(true)}
            variant='contained'
            size={isDesktop ? 'small' : 'medium'}
            sx={{marginRight: 1}}
            startIcon={<CloudUploadIcon />}>
            Upload
          </Button>}
          {permissions(Permission.EditCommunity) && <Button
            onClick={() => setEditDrawerOpen(true)}
            variant='contained'
            size={isDesktop ? 'small' : 'medium'}
            sx={{margin: 1}}
            startIcon={<EditIcon />}>
            Edit
          </Button>}
        </Toolbar>
        <Grid container spacing={2} sx={{ marginTop: 0 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant='h5'>Description</Typography>
            <p style={{ marginTop: 0, whiteSpace: 'pre-wrap' }}>{community.description}</p>
          </Grid>
          <Grid item xs={12} sm={6}>
            {permissions(Permission.ViewCommunityDocumentMetadata) &&
              <>
                <Typography variant='h5'>Documents</Typography>
                <List sx={{ '& .MuiListItemIcon-root': { minWidth: 36  }}}>
                  {documents.map(doc =>
                    permissions(Permission.ReadCommunityDocuments)
                    ? <ListItemButton key={doc.document.uploadedDocumentId} disableGutters>
                        <ListItemIcon>
                          <InsertDriveFileOutlinedIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={doc.document.uploadedFileName}
                          secondary={`${format(doc.document.timestampUtc!, "PPp")} — ${personNameString(doc.uploader)}`} />
                      </ListItemButton>
                    : <ListItem key={doc.document.uploadedDocumentId} disablePadding>
                        <ListItemIcon>
                          <InsertDriveFileOutlinedIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={doc.document.uploadedFileName}
                          secondary={`${format(doc.document.timestampUtc!, "PPp")} — ${personNameString(doc.uploader)}`} />
                      </ListItem>)}
                </List>
              </>}
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant='h5'>Role Assignments</Typography>
            <List>
              {assignees.map(assignee =>
                <ListItem key={`${assignee.personAndFamily!.person!.id}-${assignee.communityRole}`} disablePadding>
                  <ListItemText
                    primary={personNameString(assignee.personAndFamily.person)}
                    secondary={assignee.communityRole} />
                </ListItem>)}
            </List>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant='h5'>Member Families</Typography>
            <List>
              {memberFamilies.map(family =>
                <ListItem key={family.family!.id} disablePadding>
                  <ListItemText
                    primary={familyNameString(family)} />
                </ListItem>)}
            </List>
          </Grid>
        </Grid>
        {permissions(Permission.EditCommunity) &&
          <Drawer
            anchor='right'
            open={editDrawerOpen}
            onClose={() => setEditDrawerOpen(false)}
            sx={{ '.MuiDrawer-paper': { padding: 2, paddingTop: { xs: 7, sm: 8, md: 6 }}}}>
            <AddEditCommunity community={community} onClose={() => setEditDrawerOpen(false)} />
          </Drawer>}
      </Container>);
}
