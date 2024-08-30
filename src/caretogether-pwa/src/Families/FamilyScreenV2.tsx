import {
  Container,
  Toolbar,
  Grid,
  Button,
  useMediaQuery,
  useTheme,
  Box,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Chip,
  Divider,
  ListItemButton,
  ListItemIcon,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Arrangement,
  ArrangementPolicy,
  CompletedCustomFieldInfo,
  Permission,
  Referral,
  RoleRemovalReason,
} from '../GeneratedClient';
import { useRecoilValue } from 'recoil';
import { useParams } from 'react-router';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import { AdultCard } from './AdultCard';
import { ChildCard } from './ChildCard';
import { useState } from 'react';
import { AddAdultDialog } from './AddAdultDialog';
import { AddChildDialog } from './AddChildDialog';
import { AddEditNoteDialog } from '../Notes/AddEditNoteDialog';
import { ArrangementCard } from '../Referrals/Arrangements/ArrangementCard';
import { format } from 'date-fns';
import { UploadFamilyDocumentsDialog } from './UploadFamilyDocumentsDialog';
import { policyData } from '../Model/ConfigurationModel';
import { CreateArrangementDialog } from '../Referrals/Arrangements/CreateArrangementDialog';
import { CloseReferralDialog } from '../Referrals/CloseReferralDialog';
import { OpenNewReferralDialog } from '../Referrals/OpenNewReferralDialog';
import { FamilyDocuments } from './FamilyDocuments';
import { useFamilyPermissions } from '../Model/SessionModel';
import { Masonry } from '@mui/lab';
import { MissingRequirementRow } from '../Requirements/MissingRequirementRow';
import { ExemptedRequirementRow } from '../Requirements/ExemptedRequirementRow';
import { CompletedRequirementRow } from '../Requirements/CompletedRequirementRow';
import {
  ReferralContext,
  VolunteerFamilyContext,
} from '../Requirements/RequirementContext';
import { ActivityTimeline } from '../Activities/ActivityTimeline';
import { ReferralComments } from '../Referrals/ReferralComments';
import { ReferralCustomField } from '../Referrals/ReferralCustomField';
import { PrimaryContactEditor } from './PrimaryContactEditor';
import useScreenTitle from '../Shell/ShellScreenTitle';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useCommunityLookup, useFamilyLookup } from '../Model/DirectoryModel';
import { RemoveFamilyRoleDialog } from '../Volunteers/RemoveFamilyRoleDialog';
import { ResetFamilyRoleDialog } from '../Volunteers/ResetFamilyRoleDialog';
import { VolunteerRoleApprovalStatusChip } from '../Volunteers/VolunteerRoleApprovalStatusChip';
import { FamilyCustomField } from './FamilyCustomField';
import { useFilterMenu } from '../Generic/useFilterMenu';
import { FilterMenu } from '../Generic/FilterMenu';
import { isBackdropClick } from '../Utilities/handleBackdropClick';
import { DeleteFamilyDialog } from './DeleteFamilyDialog';
import { useDialogHandle } from '../Hooks/useDialogHandle';
import { familyLastName } from './FamilyUtils';
import { useLoadable } from '../Hooks/useLoadable';
import { visibleCommunitiesQuery } from '../Model/Data';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import FamilyScreenPageVersionSwitch from './FamilyScreenPageVersionSwitch';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box pt={2}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const sortArrangementsByStartDateDescThenCreateDateDesc = (
  a: Arrangement,
  b: Arrangement
) => {
  return (
    (b.startedAtUtc ?? new Date()).getTime() -
      (a.startedAtUtc ?? new Date()).getTime() ||
    (b.requestedAtUtc ?? new Date()).getTime() -
      (a.requestedAtUtc ?? new Date()).getTime()
  );
};

export function FamilyScreenV2() {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;

  // TODO: When we go to optimize the layout, we should consider updating the generated client
  // to include the ids of the communities each family is a member of in the CombinedFamilyInfo
  // data model so that we don't need to start by first looking up ALL communities
  const communitiesLoadable = useLoadable(visibleCommunitiesQuery);
  const allCommunities = (communitiesLoadable || [])
    .map((x) => x.community!)
    .sort((a, b) => (a.name! < b.name! ? -1 : a.name! > b.name! ? 1 : 0));
  const communityLookup = useCommunityLookup();
  const allCommunityInfo = allCommunities.map((c) => communityLookup(c.id)!);
  const familyCommunityInfo = allCommunityInfo?.filter((c) =>
    c.community?.memberFamilies?.includes(familyId)
  );

  const familyLookup = useFamilyLookup();
  const family = familyLookup(familyId)!;

  const policy = useRecoilValue(policyData);

  const permissions = useFamilyPermissions(family);

  const canCloseReferral =
    family?.partneringFamilyInfo?.openReferral &&
    !family.partneringFamilyInfo.openReferral.closeReason &&
    !family.partneringFamilyInfo.openReferral.arrangements?.some(
      (arrangement) => !arrangement.endedAtUtc && !arrangement.cancelledAtUtc
    ) &&
    permissions(Permission.CloseReferral);

  const deleteFamilyDialogHandle = useDialogHandle();
  const openReferrals: Referral[] =
    family?.partneringFamilyInfo?.openReferral !== undefined
      ? [family.partneringFamilyInfo.openReferral]
      : [];
  const closedReferrals: Referral[] =
    family?.partneringFamilyInfo?.closedReferrals === undefined
      ? []
      : [...family.partneringFamilyInfo.closedReferrals!].sort(
          (r1, r2) =>
            r1.closedAtUtc!.getUTCMilliseconds() -
            r2.closedAtUtc!.getUTCMilliseconds()
        );
  const allReferrals: Referral[] = [...openReferrals, ...closedReferrals];
  const [closeReferralDialogOpen, setCloseReferralDialogOpen] = useState(false);
  const [openNewReferralDialogOpen, setOpenNewReferralDialogOpen] =
    useState(false);
  const [uploadDocumentDialogOpen, setUploadDocumentDialogOpen] =
    useState(false);
  const [addAdultDialogOpen, setAddAdultDialogOpen] = useState(false);
  const [addChildDialogOpen, setAddChildDialogOpen] = useState(false);
  const [addNoteDialogOpen, setAddNoteDialogOpen] = useState(false);
  const [selectedReferralId, setSelectedReferralId] = useState<
    string | undefined
  >(allReferrals.length > 0 ? allReferrals[0].id : undefined);
  const selectedReferral = allReferrals.find(
    (r) => r.id === selectedReferralId
  );
  const [familyMoreMenuAnchor, setFamilyMoreMenuAnchor] =
    useState<Element | null>(null);

  const participatingFamilyRoles = Object.entries(
    family?.volunteerFamilyInfo?.familyRoleApprovals || {}
  ).filter(
    ([role, status]) =>
      status.currentStatus != null &&
      !family?.volunteerFamilyInfo?.roleRemovals?.find(
        (x) =>
          x.roleName === role &&
          (x.effectiveUntil == null || x.effectiveUntil > new Date())
      )
  );

  const [removeRoleParameter, setRemoveRoleParameter] = useState<{
    volunteerFamilyId: string;
    role: string;
  } | null>(null);
  function selectRemoveRole(role: string) {
    setFamilyMoreMenuAnchor(null);
    setRemoveRoleParameter({ volunteerFamilyId: familyId, role: role });
  }
  const [resetRoleParameter, setResetRoleParameter] = useState<{
    volunteerFamilyId: string;
    role: string;
    removalReason: RoleRemovalReason;
    removalAdditionalComments: string;
  } | null>(null);
  function selectResetRole(
    role: string,
    removalReason: RoleRemovalReason,
    removalAdditionalComments: string
  ) {
    setFamilyMoreMenuAnchor(null);
    setResetRoleParameter({
      volunteerFamilyId: familyId,
      role: role,
      removalReason: removalReason,
      removalAdditionalComments: removalAdditionalComments,
    });
  }

  let referralRequirementContext: ReferralContext | undefined;
  if (selectedReferral) {
    referralRequirementContext = {
      kind: 'Referral',
      partneringFamilyId: familyId,
      referralId: selectedReferral.id!,
    };
  }

  const volunteerFamilyRequirementContext: VolunteerFamilyContext = {
    kind: 'Volunteer Family',
    volunteerFamilyId: familyId,
  };

  const [
    createArrangementDialogParameter,
    setCreateArrangementDialogParameter,
  ] = useState<ArrangementPolicy | null>(null);

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
  const isWideScreen = useMediaQuery(theme.breakpoints.up('xl'));

  useScreenTitle(family ? `${familyLastName(family)} Family` : '...');

  enum ArrangementFilterOptionLabel {
    Active = 'Active',
    Cancelled = 'Cancelled',
    Ended = 'Ended',
  }
  const {
    filterOptions: arrangementFilterOptions,
    handleFilterChange: handleFilterArrangements,
  } = useFilterMenu(Object.keys(ArrangementFilterOptionLabel), [
    ArrangementFilterOptionLabel.Active,
  ]);

  const meetsArrangementFilterCriteria = (
    arrangement: Arrangement
  ): boolean => {
    return arrangementFilterOptions
      .filter((o) => o.selected)
      .map((o) => o.text)
      .some((option) => {
        const opt = option as ArrangementFilterOptionLabel;
        if (
          opt === ArrangementFilterOptionLabel.Active &&
          arrangement.cancelledAtUtc === undefined
        ) {
          return true;
        } else if (
          opt === ArrangementFilterOptionLabel.Cancelled &&
          arrangement.cancelledAtUtc !== undefined
        ) {
          return true;
        } else if (
          opt === ArrangementFilterOptionLabel.Ended &&
          arrangement.endedAtUtc !== undefined
        ) {
          return true;
        }
        return false;
      });
  };

  const filteredArrangements = selectedReferral?.arrangements
    ?.slice()
    .filter((arrangement) => meetsArrangementFilterCriteria(arrangement))
    .sort((a, b) => sortArrangementsByStartDateDescThenCreateDateDesc(a, b))
    .map((arrangement) => (
      <ArrangementCard
        key={arrangement.id}
        partneringFamily={family}
        referralId={selectedReferral.id!}
        arrangement={arrangement}
      />
    ));
  const appNavigate = useAppNavigate();

  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return !family ? (
    <ProgressBackdrop>
      <p>Loading family...</p>
    </ProgressBackdrop>
  ) : (
    <Container maxWidth={false} sx={{ paddingLeft: '12px', paddingTop: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
        >
          <Tab label="Item One" {...a11yProps(0)} />
          <Tab label="Item Two" {...a11yProps(1)} />
          <Tab label="Item Three" {...a11yProps(2)} />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
        <Toolbar variant="dense" disableGutters={true}>
          {permissions(Permission.UploadFamilyDocuments) && (
            <Button
              onClick={() => setUploadDocumentDialogOpen(true)}
              variant="contained"
              size="small"
              sx={{ margin: 1 }}
              startIcon={<CloudUploadIcon />}
            >
              Upload
            </Button>
          )}
          {permissions(Permission.EditFamilyInfo) && (
            <Button
              onClick={() => setAddAdultDialogOpen(true)}
              variant="contained"
              size="small"
              sx={{ margin: 1 }}
              startIcon={<AddCircleIcon />}
            >
              Adult
            </Button>
          )}
          {permissions(Permission.EditFamilyInfo) && (
            <Button
              onClick={() => setAddChildDialogOpen(true)}
              variant="contained"
              size="small"
              sx={{ margin: 1 }}
              startIcon={<AddCircleIcon />}
            >
              Child
            </Button>
          )}
          {permissions(Permission.AddEditDraftNotes) && (
            <Button
              onClick={() => setAddNoteDialogOpen(true)}
              variant="contained"
              size="small"
              sx={{ margin: 1 }}
              startIcon={<AddCircleIcon />}
            >
              Note
            </Button>
          )}
          {((permissions(Permission.EditVolunteerRoleParticipation) &&
            (participatingFamilyRoles.length > 0 ||
              (family.volunteerFamilyInfo?.roleRemovals &&
                family.volunteerFamilyInfo.roleRemovals.length > 0))) ||
            permissions(Permission.EditFamilyInfo)) && (
            <IconButton
              onClick={(event) => setFamilyMoreMenuAnchor(event.currentTarget)}
              size="large"
            >
              <MoreVertIcon />
            </IconButton>
          )}
          <Menu
            id="family-more-menu"
            anchorEl={familyMoreMenuAnchor}
            keepMounted
            open={Boolean(familyMoreMenuAnchor)}
            onClose={() => setFamilyMoreMenuAnchor(null)}
          >
            <MenuList dense={isDesktop}>
              {permissions(Permission.EditVolunteerRoleParticipation) &&
                participatingFamilyRoles.flatMap(([role]) => (
                  <MenuItem key={role} onClick={() => selectRemoveRole(role)}>
                    <ListItemText primary={`Remove from ${role} role`} />
                  </MenuItem>
                ))}
              {permissions(Permission.EditVolunteerRoleParticipation) &&
                (family.volunteerFamilyInfo?.roleRemovals || [])
                  .filter((removedRole) => !removedRole.effectiveUntil)
                  .map((removedRole) => (
                    <MenuItem
                      key={removedRole.roleName}
                      onClick={() =>
                        selectResetRole(
                          removedRole.roleName!,
                          removedRole.reason!,
                          removedRole.additionalComments!
                        )
                      }
                    >
                      <ListItemText
                        primary={`Reset ${removedRole.roleName} participation`}
                      />
                    </MenuItem>
                  ))}
              {permissions(Permission.EditFamilyInfo) && (
                <MenuItem onClick={deleteFamilyDialogHandle.openDialog}>
                  <ListItemText primary="Delete family" />
                </MenuItem>
              )}
            </MenuList>
          </Menu>
          {uploadDocumentDialogOpen && (
            <UploadFamilyDocumentsDialog
              family={family}
              onClose={() => setUploadDocumentDialogOpen(false)}
            />
          )}
          {addAdultDialogOpen && (
            <AddAdultDialog
              onClose={(_event: object | undefined, reason: string) =>
                !isBackdropClick(reason) ? setAddAdultDialogOpen(false) : {}
              }
            ></AddAdultDialog>
          )}
          {addChildDialogOpen && (
            <AddChildDialog
              onClose={(_event: object | undefined, reason: string) =>
                !isBackdropClick(reason) ? setAddChildDialogOpen(false) : {}
              }
            />
          )}
          {addNoteDialogOpen && (
            <AddEditNoteDialog
              familyId={family.family!.id!}
              onClose={() => setAddNoteDialogOpen(false)}
            />
          )}
          {(removeRoleParameter && (
            <RemoveFamilyRoleDialog
              volunteerFamilyId={familyId}
              role={removeRoleParameter.role}
              onClose={() => setRemoveRoleParameter(null)}
            />
          )) ||
            null}
          {(resetRoleParameter && (
            <ResetFamilyRoleDialog
              volunteerFamilyId={familyId}
              role={resetRoleParameter.role}
              removalReason={resetRoleParameter.removalReason}
              removalAdditionalComments={
                resetRoleParameter.removalAdditionalComments
              }
              onClose={() => setResetRoleParameter(null)}
            />
          )) ||
            null}
          {deleteFamilyDialogHandle.open && (
            <DeleteFamilyDialog
              key={deleteFamilyDialogHandle.key}
              handle={deleteFamilyDialogHandle}
              familyId={familyId}
            />
          )}
          <FamilyScreenPageVersionSwitch />
        </Toolbar>
        <Grid container spacing={0}>
          <Grid item container xs={12} md={4} spacing={0}>
            <Grid item xs={12}>
              <ActivityTimeline family={family} />
            </Grid>
          </Grid>
          <Grid item xs={12} md={8}>
            <Grid container spacing={0}>
              <Grid item xs={12} md={4}>
                <PrimaryContactEditor family={family} />
                {permissions(Permission.ViewReferralProgress) &&
                  family.partneringFamilyInfo && (
                    <FormControl>
                      <FormLabel
                        id="demo-radio-buttons-group-label"
                        sx={{
                          color: '#000',
                          fontSize: '1.17em',
                          fontWeight: 'bold',
                          marginBottom: 0,
                        }}
                      >
                        Referrals
                      </FormLabel>
                      <RadioGroup
                        aria-labelledby="demo-radio-buttons-group-label"
                        value={selectedReferral ? selectedReferral.id : null}
                        name="radio-buttons-group"
                      >
                        {allReferrals.map((referral) => (
                          <FormControlLabel
                            key={referral!.id}
                            value={referral!.id}
                            label={
                              referral!.closedAtUtc
                                ? `Referral Closed ${format(referral!.closedAtUtc!, 'M/d/yy')}`
                                : 'Open Referral'
                            }
                            control={<Radio />}
                            onChange={() => setSelectedReferralId(referral!.id)}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  )}
              </Grid>
              <Grid item xs={6} md={4}>
                {permissions(Permission.ViewFamilyCustomFields) &&
                  (
                    family.family!.completedCustomFields ||
                    ([] as Array<CompletedCustomFieldInfo | string>)
                  )
                    .concat(family.missingCustomFields || [])
                    .sort((a, b) =>
                      (a instanceof CompletedCustomFieldInfo
                        ? a.customFieldName!
                        : a) <
                      (b instanceof CompletedCustomFieldInfo
                        ? b.customFieldName!
                        : b)
                        ? -1
                        : (a instanceof CompletedCustomFieldInfo
                              ? a.customFieldName!
                              : a) >
                            (b instanceof CompletedCustomFieldInfo
                              ? b.customFieldName!
                              : b)
                          ? 1
                          : 0
                    )
                    .map((customField) => (
                      <FamilyCustomField
                        key={
                          typeof customField === 'string'
                            ? customField
                            : customField.customFieldName
                        }
                        familyId={familyId}
                        customField={customField}
                      />
                    ))}
                {permissions(Permission.ViewReferralCustomFields) &&
                  (
                    selectedReferral?.completedCustomFields ||
                    ([] as Array<CompletedCustomFieldInfo | string>)
                  )
                    .concat(selectedReferral?.missingCustomFields || [])
                    .sort((a, b) =>
                      (a instanceof CompletedCustomFieldInfo
                        ? a.customFieldName!
                        : a) <
                      (b instanceof CompletedCustomFieldInfo
                        ? b.customFieldName!
                        : b)
                        ? -1
                        : (a instanceof CompletedCustomFieldInfo
                              ? a.customFieldName!
                              : a) >
                            (b instanceof CompletedCustomFieldInfo
                              ? b.customFieldName!
                              : b)
                          ? 1
                          : 0
                    )
                    .map((customField) => (
                      <ReferralCustomField
                        key={
                          typeof customField === 'string'
                            ? customField
                            : customField.customFieldName
                        }
                        partneringFamilyId={familyId}
                        referralId={`${selectedReferral!.id}`}
                        customField={customField}
                      />
                    ))}
              </Grid>
              <Grid item xs={6} md={4}>
                {canCloseReferral &&
                  selectedReferral?.id?.toString() ==
                    family.partneringFamilyInfo?.openReferral?.id?.toString() && (
                    <Button
                      onClick={() => setCloseReferralDialogOpen(true)}
                      variant="contained"
                      size="small"
                      sx={{ margin: 1 }}
                    >
                      Close Referral
                    </Button>
                  )}
                {!family.partneringFamilyInfo?.openReferral &&
                  permissions(Permission.CreateReferral) && (
                    <Button
                      onClick={() => setOpenNewReferralDialogOpen(true)}
                      variant="contained"
                      size="small"
                      sx={{ margin: 1 }}
                    >
                      Open New Referral
                    </Button>
                  )}
                {closeReferralDialogOpen &&
                  selectedReferral?.id ===
                    family.partneringFamilyInfo?.openReferral?.id && (
                    <CloseReferralDialog
                      partneringFamilyId={family.family!.id!}
                      referralId={`${selectedReferral!.id}`}
                      onClose={() => setCloseReferralDialogOpen(false)}
                    />
                  )}
                {openNewReferralDialogOpen && (
                  <OpenNewReferralDialog
                    partneringFamilyId={family.family!.id!}
                    onClose={() => setOpenNewReferralDialogOpen(false)}
                  />
                )}
              </Grid>
            </Grid>
            <Grid container spacing={0} sx={{ marginBottom: '1rem' }}>
              <Grid item xs={12}>
                <h3 style={{ marginBottom: 0 }}>Communities</h3>
                {familyCommunityInfo?.map((communityInfo) => {
                  return (
                    <ListItemButton
                      key={communityInfo.community?.id}
                      sx={{
                        padding: '.5rem',
                        border: '1px solid #e0e0e0',
                        borderRadius: '5px',
                      }}
                      onClick={() =>
                        communityInfo.community && communityInfo.community.id
                          ? appNavigate.community(communityInfo.community.id)
                          : {}
                      }
                    >
                      <ListItemIcon
                        sx={{ alignSelf: 'center', justifyContent: 'center' }}
                      >
                        <Diversity3Icon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        sx={{ alignSelf: 'baseline' }}
                        primary={communityInfo.community?.name}
                        primaryTypographyProps={{
                          color: theme.palette.primary.main,
                        }}
                      ></ListItemText>
                    </ListItemButton>
                  );
                })}
              </Grid>
            </Grid>
            {permissions(Permission.ViewReferralComments) &&
              selectedReferral && (
                <Grid container spacing={0}>
                  <ReferralComments
                    partneringFamily={family}
                    referralId={selectedReferral.id!}
                  />
                </Grid>
              )}
            <Grid container spacing={0}>
              {permissions(Permission.ViewReferralProgress) &&
                selectedReferral && (
                  <>
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      style={{ paddingRight: 20 }}
                    >
                      <h3 style={{ marginBottom: 0 }}>Incomplete</h3>
                      {selectedReferral?.missingRequirements?.map(
                        (missing, i) => (
                          <MissingRequirementRow
                            key={`${missing}:${i}`}
                            requirement={missing}
                            context={referralRequirementContext!}
                            referralId={selectedReferral.id}
                          />
                        )
                      )}
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      style={{ paddingRight: 20 }}
                    >
                      <h3 style={{ marginBottom: 0 }}>Completed</h3>
                      {selectedReferral?.completedRequirements?.map(
                        (completed, i) => (
                          <CompletedRequirementRow
                            key={`${completed.completedRequirementId}:${i}`}
                            requirement={completed}
                            context={referralRequirementContext!}
                          />
                        )
                      )}
                      {selectedReferral?.exemptedRequirements?.map(
                        (exempted, i) => (
                          <ExemptedRequirementRow
                            key={`${exempted.requirementName}:${i}`}
                            requirement={exempted}
                            context={referralRequirementContext!}
                          />
                        )
                      )}
                    </Grid>
                  </>
                )}
              {family.volunteerFamilyInfo && (
                <>
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        '& > div:first-of-type': {
                          marginLeft: 0,
                        },
                        '& > *': {
                          margin: theme.spacing(0.5),
                        },
                      }}
                    >
                      {Object.entries(
                        family.volunteerFamilyInfo?.familyRoleApprovals || {}
                      ).flatMap(([role, roleApprovalStatus]) => (
                        <VolunteerRoleApprovalStatusChip
                          key={role}
                          roleName={role}
                          status={
                            roleApprovalStatus.effectiveRoleApprovalStatus
                          }
                        />
                      ))}
                      {(family.volunteerFamilyInfo?.roleRemovals || []).map(
                        (removedRole) => (
                          <Chip
                            key={removedRole.roleName}
                            size="small"
                            label={`${removedRole.roleName} - ${RoleRemovalReason[removedRole.reason!]} - ${removedRole.additionalComments}${removedRole.effectiveSince ? ' - effective ' + format(removedRole.effectiveSince, 'M/d/yy') : ''}${removedRole.effectiveUntil ? ' - through ' + format(removedRole.effectiveUntil, 'M/d/yy') : ''}`}
                          />
                        )
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} style={{ paddingRight: 20 }}>
                    <h3>Incomplete</h3>
                    {family.volunteerFamilyInfo?.missingRequirements?.map(
                      (missing, i) => (
                        <MissingRequirementRow
                          key={`${missing}:${i}`}
                          requirement={missing}
                          context={volunteerFamilyRequirementContext}
                        />
                      )
                    )}
                    <Divider />
                    {family.volunteerFamilyInfo?.availableApplications?.map(
                      (application, i) => (
                        <MissingRequirementRow
                          key={`${application}:${i}`}
                          requirement={application}
                          context={volunteerFamilyRequirementContext}
                          isAvailableApplication={true}
                        />
                      )
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} style={{ paddingRight: 20 }}>
                    <h3>Completed</h3>
                    {family.volunteerFamilyInfo?.completedRequirements?.map(
                      (completed, i) => (
                        <CompletedRequirementRow
                          key={`${completed.completedRequirementId}:${i}`}
                          requirement={completed}
                          context={volunteerFamilyRequirementContext}
                        />
                      )
                    )}
                    {family.volunteerFamilyInfo?.exemptedRequirements?.map(
                      (exempted, i) => (
                        <ExemptedRequirementRow
                          key={`${exempted.requirementName}:${i}`}
                          requirement={exempted}
                          context={volunteerFamilyRequirementContext}
                        />
                      )
                    )}
                  </Grid>
                </>
              )}
              {permissions(Permission.ViewFamilyDocumentMetadata) && (
                <Grid item xs={12} sm={6} md={4}>
                  <h3 style={{ marginBottom: 0 }}>Documents</h3>
                  <FamilyDocuments family={family} />
                </Grid>
              )}
            </Grid>
            <Grid container spacing={0}>
              {selectedReferral && (
                <Grid item xs={12}>
                  <div
                    style={{
                      display: `flex`,
                      justifyContent: `space-between`,
                      maxWidth: `100%`,
                      flexWrap: `wrap`,
                    }}
                  >
                    <div
                      style={{
                        display: `flex`,
                        justifyContent: `flex-start`,
                        maxWidth: `100%`,
                        flexWrap: `wrap`,
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          display: `flex`,
                          alignSelf: `center`,
                        }}
                      >
                        Arrangements
                      </h3>
                      <FilterMenu
                        singularLabel={`Arrangement`}
                        pluralLabel={`Arrangements`}
                        filterOptions={arrangementFilterOptions}
                        handleFilterChange={handleFilterArrangements}
                      />
                    </div>
                    {permissions(Permission.CreateArrangement) && (
                      <Box
                        sx={{
                          textAlign: 'center',
                          display: `flex`,
                          flexDirection: `row`,
                          maxWidth: `100%`,
                          flexWrap: `wrap`,
                        }}
                      >
                        {selectedReferral &&
                          policy.referralPolicy?.arrangementPolicies?.map(
                            (arrangementPolicy) => (
                              <Box key={arrangementPolicy.arrangementType}>
                                <Button
                                  onClick={() =>
                                    setCreateArrangementDialogParameter(
                                      arrangementPolicy
                                    )
                                  }
                                  variant="contained"
                                  size="small"
                                  sx={{ margin: 1 }}
                                  startIcon={<AddCircleIcon />}
                                >
                                  {arrangementPolicy.arrangementType}
                                </Button>
                              </Box>
                            )
                          )}
                      </Box>
                    )}
                  </div>
                  <Masonry
                    columns={isDesktop ? (isWideScreen ? 3 : 2) : 1}
                    spacing={2}
                    style={{
                      height:
                        filteredArrangements?.length === 0 ? 0 : undefined,
                    }}
                  >
                    {filteredArrangements || false}
                  </Masonry>
                  {createArrangementDialogParameter && (
                    <CreateArrangementDialog
                      referralId={`${selectedReferral!.id}`}
                      arrangementPolicy={createArrangementDialogParameter}
                      onClose={() => setCreateArrangementDialogParameter(null)}
                    />
                  )}
                </Grid>
              )}
              <Grid item xs={12}>
                <h3 style={{ marginBottom: 0 }}>Family Members</h3>
                <Masonry
                  columns={isDesktop ? (isWideScreen ? 3 : 2) : 1}
                  spacing={2}
                >
                  {family.family?.adults?.map(
                    (adult) =>
                      adult.item1 &&
                      adult.item1.id &&
                      adult.item1.active &&
                      adult.item2 && (
                        <AdultCard
                          key={adult.item1.id}
                          familyId={familyId}
                          personId={adult.item1.id}
                        />
                      )
                  )}
                  {family.family?.children?.map(
                    (child) =>
                      child.active && (
                        <ChildCard
                          key={child.id!}
                          familyId={familyId}
                          personId={child.id!}
                        />
                      )
                  )}
                </Masonry>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        Item Two
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2}>
        Item Three
      </CustomTabPanel>
    </Container>
  );
}
