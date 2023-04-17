import { Button, Container, Grid, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useParams } from 'react-router-dom';
import { Permission } from '../GeneratedClient';
import { useCommunityLookup } from '../Model/DirectoryModel';
import { useCommunityPermissions } from '../Model/SessionModel';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import useScreenTitle from '../Shell/ShellScreenTitle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EditIcon from '@mui/icons-material/Edit';
import { AddEditCommunity } from './AddEditCommunity';
import { CommunityDocumentUpload } from './CommunityDocumentUploadForm';
import { CommunityDocuments } from './CommunityDocuments';
import { GroupAdd, PersonAddAlt1 } from '@mui/icons-material';
import { AddMemberFamiliesForm } from './AddMemberFamiliesForm';
import { AddRoleAssignmentForm } from './AddRoleAssignmentForm';
import { CommunityMemberFamilies } from './CommunityMemberFamilies';
import { CommunityRoleAssignments } from './CommunityRoleAssignments';
import { useDrawer } from '../Shell/ShellDrawer';
import { useDataLoaded } from '../Model/Data';

export function CommunityScreen() {
  const communityIdMaybe = useParams<{ communityId: string; }>();
  const communityId = communityIdMaybe.communityId as string;

  const dataLoaded = useDataLoaded();

  const communityLookup = useCommunityLookup();
  const communityInfo = communityLookup(communityId)!;
  const community = communityInfo?.community;

  useScreenTitle(community?.name || "...");

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
  // const isWideScreen = useMediaQuery(theme.breakpoints.up('xl'));

  // const policy = useRecoilValue(policyData);
  const permissions = useCommunityPermissions(communityInfo);

  const editDrawer = useDrawer();
  const uploadDrawer = useDrawer();
  const addMemberFamilyDrawer = useDrawer();
  const addRoleAssignmentDrawer = useDrawer();
  // const deleteCommunityDrawer = useDrawer();
  
  return ((!dataLoaded || !community)
    ? <ProgressBackdrop>
        <p>Loading community...</p>
      </ProgressBackdrop>
    : <Container maxWidth={false} sx={{ paddingLeft: '12px' }}>
        <Toolbar disableGutters variant={isDesktop ? 'dense' : 'regular'}>
          {permissions(Permission.EditCommunity) && <Button
            onClick={editDrawer.openDrawer}
            variant='contained'
            size={isDesktop ? 'small' : 'medium'}
            sx={{margin: 1}}
            startIcon={<EditIcon />}>
            Rename
          </Button>}
          {/* {permissions(Permission.DeleteCommunity) && <Button
            onClick={() => setDeleteCommunityDrawerOpen(true)}
            variant='contained' disabled
            size={isDesktop ? 'small' : 'medium'}
            sx={{margin: 1}}
            startIcon={<DeleteForever />}>
            Delete
          </Button>} */}
        </Toolbar>
        <Grid container spacing={2} sx={{ marginTop: 0 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant='h5'>
              Description
              {permissions(Permission.EditCommunity) && <Button
                onClick={editDrawer.openDrawer}
                variant='text'
                size={isDesktop ? 'small' : 'medium'}
                sx={{marginLeft: 2}}
                startIcon={<EditIcon />}>
                Edit
              </Button>}
            </Typography>
            <p style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>{community.description}</p>
          </Grid>
          <Grid item xs={12} sm={6}>
            {permissions(Permission.ViewCommunityDocumentMetadata) &&
              <>
                <Typography variant='h5'>
                  Documents
                  {permissions(Permission.UploadCommunityDocuments) && <Button
                    onClick={uploadDrawer.openDrawer}
                    variant='text'
                    size={isDesktop ? 'small' : 'medium'}
                    sx={{marginLeft: 2}}
                    startIcon={<CloudUploadIcon />}>
                    Upload
                  </Button>}
                </Typography>
                <CommunityDocuments communityInfo={communityInfo} />
              </>}
          </Grid>
          <Grid item xs={12} sm={5}>
            <Typography variant='h5'>
              Member Families
              {permissions(Permission.EditCommunityMemberFamilies) && <Button
                onClick={addMemberFamilyDrawer.openDrawer}
                variant='text'
                size={isDesktop ? 'small' : 'medium'}
                sx={{marginLeft: 2}}
                startIcon={<GroupAdd />}>
                Add
              </Button>}
            </Typography>
            <CommunityMemberFamilies communityInfo={communityInfo} />
          </Grid>
          <Grid item xs={0} sm={1}></Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant='h5'>
              Role Assignments
              {permissions(Permission.EditCommunityRoleAssignments) && <Button
                onClick={addRoleAssignmentDrawer.openDrawer}
                variant='text'
                size={isDesktop ? 'small' : 'medium'}
                sx={{marginLeft: 2}}
                startIcon={<PersonAddAlt1 />}>
                Add
              </Button>}
            </Typography>
            <CommunityRoleAssignments communityInfo={communityInfo} />
          </Grid>
        </Grid>
        {permissions(Permission.EditCommunity) && editDrawer.drawerFor(
          <AddEditCommunity community={community} onClose={editDrawer.closeDrawer} />
        )}
        {permissions(Permission.UploadCommunityDocuments) && uploadDrawer.drawerFor(
          <CommunityDocumentUpload community={community} onClose={uploadDrawer.closeDrawer} />
        )}
        {permissions(Permission.EditCommunityMemberFamilies) && addMemberFamilyDrawer.drawerFor(
          <AddMemberFamiliesForm community={community} onClose={addMemberFamilyDrawer.closeDrawer} />
        )}
        {permissions(Permission.EditCommunityRoleAssignments) && addRoleAssignmentDrawer.drawerFor(
          <AddRoleAssignmentForm community={community} onClose={addRoleAssignmentDrawer.closeDrawer} />
        )}
        {/* {permissions(Permission.DeleteCommunity) && deleteCommunityDrawer.drawerFor(
          <DeleteCommunityForm community={community} onClose={deleteCommunityDrawer.closeDrawer} />
        )} */}
      </Container>);
}
