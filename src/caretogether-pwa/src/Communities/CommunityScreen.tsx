import { Button, Container, Drawer, Grid, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { familyNameString } from '../Families/FamilyName';
import { personNameString } from '../Families/PersonName';
import { CombinedFamilyInfo, Permission } from '../GeneratedClient';
import { useCommunityLookup, useDataInitialized, usePersonAndFamilyLookup, useUserLookup, visibleFamiliesQuery } from '../Model/DirectoryModel';
import { useCommunityPermissions } from '../Model/SessionModel';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import useScreenTitle from '../Shell/ShellScreenTitle';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EditIcon from '@mui/icons-material/Edit';
import { useState } from 'react';
import { format } from 'date-fns';
import { AddEditCommunity } from './AddEditCommunity';

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
