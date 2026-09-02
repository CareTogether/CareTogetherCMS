import Grid from '@mui/material/Grid';
import {
  Button,
  Box,
  Chip,
  Container,
  Toolbar,
  Tooltip,
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
import { useEffect, useState } from 'react';
import { useOrganizationConfigurationLoadable } from '../Model/ConfigurationModel';
import { OrganizationPrimaryHeaderInfo } from './OrganizationPrimaryHeaderInfo';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import {
  ORGANIZATION_APPROVALS_FEATURE_FLAG,
  ORGANIZATION_CATEGORIES_FEATURE_FLAG,
} from '../featureFlags';
import {
  OrganizationApprovalRoleSummaryCards,
  OrganizationApprovalSection,
} from './OrganizationApprovalSection';
import {
  OrganizationScreenTab,
  OrganizationScreenTabsV2,
  OrganizationScreenTabValue,
} from './OrganizationScreenTabsV2';
import { useOrganizationApprovalViewModel } from './useOrganizationApprovalViewModel';
import { usePolicy } from '../Model/PolicyModel';

export function CommunityScreen() {
  const communityIdMaybe = useParams<{ communityId: string }>();
  const communityId = communityIdMaybe.communityId as string;

  const organizationConfiguration = useOrganizationConfigurationLoadable();
  const organizationCategoriesEnabled =
    useFeatureFlagEnabled(ORGANIZATION_CATEGORIES_FEATURE_FLAG) === true;
  const organizationApprovalsEnabled =
    useFeatureFlagEnabled(ORGANIZATION_APPROVALS_FEATURE_FLAG) === true;
  const policy = usePolicy();

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
  const canEditOrganization = permissions(Permission.EditOrganization);

  const editDrawer = useDrawer();
  const uploadDrawer = useDrawer();
  const addMemberFamilyDrawer = useDrawer();
  const addRoleAssignmentDrawer = useDrawer();
  const [editHasUnsavedChanges, setEditHasUnsavedChanges] = useState(false);
  const [selectedTab, setSelectedTab] =
    useState<OrganizationScreenTabValue>('overview');
  // const deleteCommunityDrawer = useDrawer();

  const { approvalAttentionCounts } =
    useOrganizationApprovalViewModel(communityInfo);
  const hasConfiguredApprovalRoles =
    Object.keys(policy?.organizationApprovalPolicy?.organizationRoles ?? {})
      .length > 0;
  const canAccessApprovals = communityInfo?.approvalInfo
    ? permissions(Permission.ViewApprovalStatus) ||
      permissions(Permission.ViewApprovalProgress)
    : permissions(Permission.ActivateOrganizationApprovals);
  const showApprovalsTab =
    organizationApprovalsEnabled &&
    hasConfiguredApprovalRoles &&
    canAccessApprovals;

  useEffect(() => {
    if (selectedTab === 'approvals' && !showApprovalsTab) {
      setSelectedTab('overview');
    }
  }, [selectedTab, showApprovalsTab]);

  function approvalTabLabel() {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          flexWrap: 'nowrap',
          whiteSpace: 'nowrap',
          width: 'max-content',
        }}
      >
        <Box component="span" className="ph-unmask" sx={{ flexShrink: 0 }}>
          Approvals
        </Box>
        {approvalAttentionCounts.missing > 0 && (
          <Tooltip title={`${approvalAttentionCounts.missing} missing`}>
            <Chip
              className="ph-unmask"
              size="small"
              color="error"
              label={approvalAttentionCounts.missing}
              aria-label={`${approvalAttentionCounts.missing} missing approvals`}
              sx={{
                height: 20,
                flexShrink: 0,
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          </Tooltip>
        )}
        {approvalAttentionCounts.expired > 0 && (
          <Tooltip title={`${approvalAttentionCounts.expired} expired`}>
            <Chip
              className="ph-unmask"
              size="small"
              color="warning"
              label={approvalAttentionCounts.expired}
              aria-label={`${approvalAttentionCounts.expired} expired approvals`}
              sx={{
                height: 20,
                flexShrink: 0,
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          </Tooltip>
        )}
      </Box>
    );
  }

  function approvalsMobileLabel() {
    const details = [
      approvalAttentionCounts.missing > 0
        ? `${approvalAttentionCounts.missing} missing`
        : null,
      approvalAttentionCounts.expired > 0
        ? `${approvalAttentionCounts.expired} expired`
        : null,
    ].filter(Boolean);
    return details.length === 0
      ? 'Approvals'
      : `Approvals (${details.join(', ')})`;
  }

  const tabs: OrganizationScreenTab[] = [
    {
      value: 'overview',
      desktopLabel: 'Overview',
      mobileLabel: 'Overview',
    },
    ...(showApprovalsTab
      ? [
          {
            value: 'approvals' as const,
            desktopLabel: approvalTabLabel(),
            mobileLabel: approvalsMobileLabel(),
          },
        ]
      : []),
  ];

  function closeEditor() {
    setEditHasUnsavedChanges(false);
    editDrawer.closeDrawer();
  }

  function requestCloseEditor() {
    if (
      editHasUnsavedChanges &&
      !window.confirm(
        'You have unsaved changes that will be lost. Are you sure?'
      )
    ) {
      return;
    }

    closeEditor();
  }

  if (!community) {
    return <Navigate to=".." replace />;
  }

  if (organizationCategoriesEnabled && !organizationConfiguration) {
    return (
      <ProgressBackdrop>
        <p>Loading organization...</p>
      </ProgressBackdrop>
    );
  }

  return (
    <Container maxWidth={false} sx={{ paddingLeft: '12px' }}>
      <Toolbar
        disableGutters
        variant={isDesktop ? 'dense' : 'regular'}
        sx={{
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          py: 1,
        }}
      >
        <OrganizationPrimaryHeaderInfo
          availableCategories={
            organizationCategoriesEnabled
              ? (organizationConfiguration?.organizationCategories ?? [])
              : undefined
          }
          community={community}
          onEdit={
            organizationCategoriesEnabled && canEditOrganization
              ? editDrawer.openDrawer
              : undefined
          }
        />
        {canEditOrganization && (
          <Button
            className="ph-unmask"
            onClick={editDrawer.openDrawer}
            variant="contained"
            size={isDesktop ? 'small' : 'medium'}
            startIcon={<EditIcon />}
          >
            Edit
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
      <OrganizationApprovalRoleSummaryCards communityInfo={communityInfo} />
      <OrganizationScreenTabsV2
        tabs={tabs}
        selectedTab={selectedTab}
        isDesktop={isDesktop}
        onChange={setSelectedTab}
      />
      {selectedTab === 'overview' && (
        <Grid container spacing={2} sx={{ marginTop: 0 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography className="ph-unmask" variant="h5">
              Description
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
      )}
      {selectedTab === 'approvals' && policy && (
        <OrganizationApprovalSection
          communityInfo={communityInfo}
          policy={policy}
        />
      )}
      {canEditOrganization &&
        editDrawer.drawerFor(
          <AddEditCommunity
            availableCategories={
              organizationCategoriesEnabled
                ? (organizationConfiguration?.organizationCategories ?? [])
                : undefined
            }
            community={community}
            onClose={requestCloseEditor}
            onDirtyChange={setEditHasUnsavedChanges}
            onSaveCompleted={closeEditor}
          />,
          requestCloseEditor
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
