import Grid from '@mui/material/Grid';
import {
  Button,
  Box,
  Container,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Navigate, useParams } from 'react-router-dom';
import { Permission } from '../GeneratedClient';
import { useCommunityPermissions } from '../Model/SessionModel';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import {
  CloudUpload as CloudUploadIcon,
  Edit as EditIcon,
  GroupAdd,
  PersonAddAlt1,
} from '@mui/icons-material';
import { AddEditCommunity } from './AddEditCommunity';
import { CommunityDocumentUpload } from './CommunityDocumentUploadForm';
import { CommunityDocuments } from './CommunityDocuments';
import { AddMemberFamiliesForm } from './AddMemberFamiliesForm';
import { AddRoleAssignmentForm } from './AddRoleAssignmentForm';
import { CommunityMemberFamilies } from './CommunityMemberFamilies';
import { CommunityRoleAssignments } from './CommunityRoleAssignments';
import { useDrawer } from '../Generic/ShellDrawer';
import { useVisibleCommunities } from '../Model/Data';
import { useState } from 'react';
import { useOrganizationConfigurationLoadable } from '../Model/ConfigurationModel';
import { OrganizationCategoriesSection } from './OrganizationCategoriesSection';
import { EditOrganizationCategoriesDrawer } from './EditOrganizationCategoriesDrawer';

export function CommunityScreen() {
  const communityIdMaybe = useParams<{ communityId: string }>();
  const communityId = communityIdMaybe.communityId as string;

  const organizationConfiguration = useOrganizationConfigurationLoadable();
  const visibleCommunities = useVisibleCommunities();
  const communityInfo = visibleCommunities.find(
    ({ community }) => community?.id === communityId
  );
  const community = communityInfo?.community;

  useScreenTitle(community?.name || '...');

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
  // const isWideScreen = useMediaQuery(theme.breakpoints.up('xl'));

  const permissions = useCommunityPermissions(communityInfo);

  const editDrawer = useDrawer();
  const uploadDrawer = useDrawer();
  const addMemberFamilyDrawer = useDrawer();
  const addRoleAssignmentDrawer = useDrawer();
  const [categoriesDrawerOpen, setCategoriesDrawerOpen] = useState(false);
  // const deleteCommunityDrawer = useDrawer();

  if (!community) {
    return <Navigate to=".." replace />;
  }

  return (
    <Container maxWidth={false} sx={{ paddingLeft: '12px' }}>
      <Toolbar disableGutters variant={isDesktop ? 'dense' : 'regular'}>
        {permissions(Permission.EditOrganization) && (
          <Button
            onClick={editDrawer.openDrawer}
            variant="contained"
            size={isDesktop ? 'small' : 'medium'}
            sx={{ margin: 1 }}
            startIcon={<EditIcon />}
          >
            Rename
          </Button>
        )}
        {/* {permissions(Permission.DeleteOrganization) && <Button
            onClick={() => setDeleteCommunityDrawerOpen(true)}
            variant='contained' disabled
            size={isDesktop ? 'small' : 'medium'}
            sx={{margin: 1}}
            startIcon={<DeleteForever />}>
            Delete
          </Button>} */}
      </Toolbar>
      <OrganizationCategoriesSection
        availableCategories={
          organizationConfiguration?.organizationCategories ?? []
        }
        categoryIds={community.categoryIds ?? []}
        canEdit={permissions(Permission.EditOrganization)}
        onEdit={() => setCategoriesDrawerOpen(true)}
      />
      <Grid container spacing={2} sx={{ marginTop: 0 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="h5">
            Description
            {permissions(Permission.EditOrganization) && (
              <Button
                onClick={editDrawer.openDrawer}
                variant="text"
                size={isDesktop ? 'small' : 'medium'}
                sx={{ marginLeft: 2 }}
                startIcon={<EditIcon />}
              >
                Edit
              </Button>
            )}
          </Typography>
          <p style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
            {community.description}
          </p>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          {permissions(Permission.ViewOrganizationDocumentMetadata) && (
            <>
              <Typography variant="h5">
                Documents
                {permissions(Permission.UploadOrganizationDocuments) && (
                  <Button
                    onClick={uploadDrawer.openDrawer}
                    variant="text"
                    size={isDesktop ? 'small' : 'medium'}
                    sx={{ marginLeft: 2 }}
                    startIcon={<CloudUploadIcon />}
                  >
                    Upload
                  </Button>
                )}
              </Typography>
              <CommunityDocuments communityInfo={communityInfo} />
            </>
          )}
          <Box
            sx={{
              marginTop: permissions(
                Permission.ViewOrganizationDocumentMetadata
              )
                ? 3
                : 0,
            }}
          >
            <Typography variant="h5">
              Role Assignments
              {permissions(Permission.EditOrganizationRoleAssignments) && (
                <Button
                  onClick={addRoleAssignmentDrawer.openDrawer}
                  variant="text"
                  size={isDesktop ? 'small' : 'medium'}
                  sx={{ marginLeft: 2 }}
                  startIcon={<PersonAddAlt1 />}
                >
                  Add
                </Button>
              )}
            </Typography>
            <CommunityRoleAssignments communityInfo={communityInfo} />
          </Box>
        </Grid>
        <Grid size={12}>
          <Typography variant="h5">
            Member Families
            {permissions(Permission.EditOrganizationMemberFamilies) && (
              <Button
                onClick={addMemberFamilyDrawer.openDrawer}
                variant="text"
                size={isDesktop ? 'small' : 'medium'}
                sx={{ marginLeft: 2 }}
                startIcon={<GroupAdd />}
              >
                Add
              </Button>
            )}
          </Typography>
          <CommunityMemberFamilies communityInfo={communityInfo} />
        </Grid>
      </Grid>
      {permissions(Permission.EditOrganization) &&
        editDrawer.drawerFor(
          <AddEditCommunity
            community={community}
            onClose={editDrawer.closeDrawer}
          />
        )}
      {permissions(Permission.EditOrganization) && categoriesDrawerOpen && (
        <EditOrganizationCategoriesDrawer
          availableCategories={
            organizationConfiguration?.organizationCategories ?? []
          }
          categoryIds={community.categoryIds ?? []}
          communityId={community.id!}
          onClose={() => setCategoriesDrawerOpen(false)}
        />
      )}
      {permissions(Permission.UploadOrganizationDocuments) &&
        uploadDrawer.drawerFor(
          <CommunityDocumentUpload
            community={community}
            onClose={uploadDrawer.closeDrawer}
          />
        )}
      {permissions(Permission.EditOrganizationMemberFamilies) &&
        addMemberFamilyDrawer.drawerFor(
          <AddMemberFamiliesForm
            community={community}
            onClose={addMemberFamilyDrawer.closeDrawer}
          />
        )}
      {permissions(Permission.EditOrganizationRoleAssignments) &&
        addRoleAssignmentDrawer.drawerFor(
          <AddRoleAssignmentForm
            community={community}
            onClose={addRoleAssignmentDrawer.closeDrawer}
          />
        )}
      {/* {permissions(Permission.DeleteOrganization) && deleteCommunityDrawer.drawerFor(
          <DeleteCommunityForm community={community} onClose={deleteCommunityDrawer.closeDrawer} />
        )} */}
    </Container>
  );
}
