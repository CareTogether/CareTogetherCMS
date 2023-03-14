import { Button, Container, Drawer, Grid, List, ListItem, ListItemText, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { familyNameString } from '../Families/FamilyName';
import { personNameString } from '../Families/PersonName';
import { CombinedFamilyInfo, Permission } from '../GeneratedClient';
import { useCommunityLookup, useDataInitialized, usePersonAndFamilyLookup, visibleFamiliesQuery } from '../Model/DirectoryModel';
import { useCommunityPermissions } from '../Model/SessionModel';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import useScreenTitle from '../Shell/ShellScreenTitle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EditIcon from '@mui/icons-material/Edit';
import { useState } from 'react';
import { AddEditCommunity } from './AddEditCommunity';
import { CommunityDocumentUpload } from './CommunityDocumentUploadForm';
import { CommunityDocuments } from './CommunityDocuments';
import { DeleteForever, GroupAdd, PersonAddAlt1 } from '@mui/icons-material';

export function CommunityScreen() {
  const communityIdMaybe = useParams<{ communityId: string; }>();
  const communityId = communityIdMaybe.communityId as string;

  const dataInitialized = useDataInitialized();

  const communityLookup = useCommunityLookup();
  const communityInfo = communityLookup(communityId)!;
  const community = communityInfo?.community;

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
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false);
  const [addMemberFamilyDrawerOpen, setAddMemberFamilyDrawerOpen] = useState(false);
  const [addRoleAssignmentDrawerOpen, setAddRoleAssignmentDrawerOpen] = useState(false);
  const [deleteCommunityDrawerOpen, setDeleteCommunityDrawerOpen] = useState(false);
  
  return ((!dataInitialized || !community)
    ? <ProgressBackdrop>
        <p>Loading community...</p>
      </ProgressBackdrop>
    : <Container maxWidth={false} sx={{ paddingLeft: '12px' }}>
        <Toolbar disableGutters variant={isDesktop ? 'dense' : 'regular'}>
          {permissions(Permission.UploadCommunityDocuments) && <Button
            onClick={() => setUploadDrawerOpen(true)}
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
          {permissions(Permission.EditCommunityMemberFamilies) && <Button
            onClick={() => setAddMemberFamilyDrawerOpen(true)}
            variant='contained'
            size={isDesktop ? 'small' : 'medium'}
            sx={{margin: 1}}
            startIcon={<GroupAdd />}>
            Add Member Family
          </Button>}
          {permissions(Permission.EditCommunityRoleAssignments) && <Button
            onClick={() => setAddRoleAssignmentDrawerOpen(true)}
            variant='contained'
            size={isDesktop ? 'small' : 'medium'}
            sx={{margin: 1}}
            startIcon={<PersonAddAlt1 />}>
            Add Role Assignment
          </Button>}
          {permissions(Permission.DeleteCommunity) && <Button
            onClick={() => setDeleteCommunityDrawerOpen(true)}
            variant='contained'
            size={isDesktop ? 'small' : 'medium'}
            sx={{margin: 1}}
            startIcon={<DeleteForever />}>
            Delete
          </Button>}
        </Toolbar>
        <Grid container spacing={2} sx={{ marginTop: 0 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant='h5'>Description</Typography>
            <p style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>{community.description}</p>
          </Grid>
          <Grid item xs={12} sm={6}>
            {permissions(Permission.ViewCommunityDocumentMetadata) &&
              <>
                <Typography variant='h5'>Documents</Typography>
                <CommunityDocuments communityInfo={communityInfo} />
              </>}
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
        </Grid>
        {permissions(Permission.EditCommunity) &&
          <Drawer
            anchor='right'
            open={editDrawerOpen}
            onClose={() => setEditDrawerOpen(false)}
            sx={{ '.MuiDrawer-paper': { padding: 2, paddingTop: { xs: 7, sm: 8, md: 6 }}}}>
            <AddEditCommunity community={community} onClose={() => setEditDrawerOpen(false)} />
          </Drawer>}
        {permissions(Permission.UploadCommunityDocuments) &&
          <Drawer
            anchor='right'
            open={uploadDrawerOpen}
            onClose={() => setUploadDrawerOpen(false)}
            sx={{ '.MuiDrawer-paper': { padding: 2, paddingTop: { xs: 7, sm: 8, md: 6 }}}}>
            <CommunityDocumentUpload community={community} onClose={() => setUploadDrawerOpen(false)} />
          </Drawer>}
        {permissions(Permission.EditCommunityMemberFamilies) &&
          <Drawer
            anchor='right'
            open={addMemberFamilyDrawerOpen}
            onClose={() => setAddMemberFamilyDrawerOpen(false)}
            sx={{ '.MuiDrawer-paper': { padding: 2, paddingTop: { xs: 7, sm: 8, md: 6 }}}}>
            <AddEditCommunity /*TODO*/ community={community} onClose={() => setAddMemberFamilyDrawerOpen(false)} />
          </Drawer>}
        {permissions(Permission.EditCommunityRoleAssignments) &&
          <Drawer
            anchor='right'
            open={addRoleAssignmentDrawerOpen}
            onClose={() => setAddRoleAssignmentDrawerOpen(false)}
            sx={{ '.MuiDrawer-paper': { padding: 2, paddingTop: { xs: 7, sm: 8, md: 6 }}}}>
            <CommunityDocumentUpload /*TODO*/ community={community} onClose={() => setAddRoleAssignmentDrawerOpen(false)} />
          </Drawer>}
        {permissions(Permission.DeleteCommunity) &&
          <Drawer
            anchor='right'
            open={deleteCommunityDrawerOpen}
            onClose={() => setDeleteCommunityDrawerOpen(false)}
            sx={{ '.MuiDrawer-paper': { padding: 2, paddingTop: { xs: 7, sm: 8, md: 6 }}}}>
            <CommunityDocumentUpload /*TODO*/ community={community} onClose={() => setDeleteCommunityDrawerOpen(false)} />
          </Drawer>}
      </Container>);
}
