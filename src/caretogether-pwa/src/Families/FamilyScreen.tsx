import { useReactToPrint } from 'react-to-print';

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
} from '@mui/material';
import {
  CompletedCustomFieldInfo,
  Permission,
  Referral,
  RoleRemovalReason,
} from '../GeneratedClient';
import { useParams } from 'react-router';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import { AdultCard } from './AdultCard';
import { ChildCard } from './ChildCard';
import { useEffect, useRef, useState } from 'react';
import { AddAdultDialog } from './AddAdultDialog';
import { AddChildDialog } from './AddChildDialog';
import { AddEditNoteDialog } from '../Notes/AddEditNoteDialog';
import { format } from 'date-fns';
import { UploadFamilyDocumentsDialog } from './UploadFamilyDocumentsDialog';
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
import { useCommunityLookup, useFamilyLookup } from '../Model/DirectoryModel';
import { RemoveFamilyRoleDialog } from '../Volunteers/RemoveFamilyRoleDialog';
import { ResetFamilyRoleDialog } from '../Volunteers/ResetFamilyRoleDialog';
import { VolunteerRoleApprovalStatusChip } from '../Volunteers/VolunteerRoleApprovalStatusChip';
import { FamilyCustomField } from './FamilyCustomField';
import { isBackdropClick } from '../Utilities/handleBackdropClick';
import { DeleteFamilyDialog } from './DeleteFamilyDialog';
import { useDialogHandle } from '../Hooks/useDialogHandle';
import { familyLastName } from './FamilyUtils';
import { useLoadable } from '../Hooks/useLoadable';
import { visibleCommunitiesQuery } from '../Model/Data';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import FamilyScreenPageVersionSwitch from './FamilyScreenPageVersionSwitch';
import posthog from 'posthog-js';
import { AssignmentsSection } from '../Families/AssignmentsSection';
import { useMemo } from 'react';
import { useSyncReferralIdInURL } from '../Hooks/useSyncReferralIdInURL';
import { ArrangementsSection } from '../Referrals/Arrangements/ArrangementsSection/ArrangementsSection';

export function FamilyScreen() {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;

  const searchParams = new URLSearchParams(location.search);
  const referralIdFromQuery = searchParams.get('referralId') ?? undefined;

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

  const appNavigate = useAppNavigate();

  const familyLookup = useFamilyLookup();
  const family = familyLookup(familyId);

  const permissions = useFamilyPermissions(family);

  const canCloseReferral =
    family?.partneringFamilyInfo?.openReferral &&
    !family.partneringFamilyInfo.openReferral.closeReason &&
    !family.partneringFamilyInfo.openReferral.arrangements?.some(
      (arrangement) => !arrangement.endedAtUtc && !arrangement.cancelledAtUtc
    ) &&
    permissions(Permission.CloseReferral);

  const deleteFamilyDialogHandle = useDialogHandle();
  const openReferrals: Referral[] = useMemo(() => {
    return family?.partneringFamilyInfo?.openReferral !== undefined
      ? [family.partneringFamilyInfo.openReferral]
      : [];
  }, [family?.partneringFamilyInfo?.openReferral]);

  const closedReferrals: Referral[] = useMemo(() => {
    return family?.partneringFamilyInfo?.closedReferrals === undefined
      ? []
      : [...family.partneringFamilyInfo.closedReferrals!].sort(
          (r1, r2) =>
            r1.closedAtUtc!.getUTCMilliseconds() -
            r2.closedAtUtc!.getUTCMilliseconds()
        );
  }, [family?.partneringFamilyInfo?.closedReferrals]);

  const allReferrals: Referral[] = useMemo(() => {
    return [...openReferrals, ...closedReferrals];
  }, [openReferrals, closedReferrals]);
  const [closeReferralDialogOpen, setCloseReferralDialogOpen] = useState(false);
  const [openNewReferralDialogOpen, setOpenNewReferralDialogOpen] =
    useState(false);
  const [uploadDocumentDialogOpen, setUploadDocumentDialogOpen] =
    useState(false);
  const [addAdultDialogOpen, setAddAdultDialogOpen] = useState(false);
  const [addChildDialogOpen, setAddChildDialogOpen] = useState(false);
  const [addNoteDialogOpen, setAddNoteDialogOpen] = useState(false);

  const firstReferralId =
    allReferrals.length > 0 ? allReferrals[0].id : undefined;

  const [selectedReferralId, setSelectedReferralId] = useState<
    string | undefined
  >(referralIdFromQuery || firstReferralId);

  const selectedReferral = allReferrals.find(
    (referral) => referral.id === selectedReferralId
  );

  useEffect(() => {
    if (
      referralIdFromQuery &&
      allReferrals.some((ref) => ref.id === referralIdFromQuery)
    ) {
      setSelectedReferralId(referralIdFromQuery);
    }
  }, [referralIdFromQuery, allReferrals]);

  // If user navigates to a different family without leaving current page (i.e. not unmounting this component),
  // we want to auto-select the first referral
  useEffect(() => {
    if (!selectedReferral) {
      posthog.capture('auto selected first referral');

      if (firstReferralId) {
        setSelectedReferralId(firstReferralId);
      }
    }
  }, [firstReferralId, selectedReferral]);

  useSyncReferralIdInURL({ familyId, referralIdFromQuery, selectedReferralId });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hasArrangementId = searchParams.has('arrangementId');

    if (hasArrangementId) {
      appNavigate.family(
        familyId,
        searchParams.get('referralId') ?? undefined,
        undefined,
        { replace: true }
      );
    }
  }, [familyId, appNavigate]);

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

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
  const isWideScreen = useMediaQuery(theme.breakpoints.up('xl'));

  useScreenTitle(family ? `${familyLastName(family)} Family` : '...');

  function handleReferralChange(referralId: string) {
    setSelectedReferralId(referralId);
  }

  const printContentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef: printContentRef });

  if (!family) {
    return (
      <Box
        height="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
        textAlign="center"
      >
        <Typography variant="h4" gutterBottom>
          You don’t have permission to view this family.
        </Typography>
        <Button variant="contained" onClick={() => appNavigate.dashboard()}>
          Home
        </Button>
      </Box>
    );
  }

  return (
    <Container maxWidth={false} sx={{ paddingLeft: '12px' }}>
      <Toolbar variant="dense" disableGutters={true}>
        {permissions(Permission.UploadFamilyDocuments) && (
          <Button
            className="ph-unmask"
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
            className="ph-unmask"
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
            className="ph-unmask"
            onClick={() => setAddChildDialogOpen(true)}
            variant="contained"
            size="small"
            sx={{ margin: 1 }}
            startIcon={<AddCircleIcon />}
          >
            Child
          </Button>
        )}
        {(permissions(Permission.AddEditDraftNotes) ||
          permissions(Permission.AddEditOwnDraftNotes)) && (
          <Button
            className="ph-unmask"
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

            <MenuItem onClick={() => reactToPrintFn()}>
              <ListItemText primary="Print notes" />
            </MenuItem>

            {permissions(Permission.EditFamilyInfo) && (
              <MenuItem onClick={deleteFamilyDialogHandle.openDialog}>
                <ListItemText className="ph-unmask" primary="Delete family" />
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
        <Grid item xs={12} md={4} spacing={0}>
          <ActivityTimeline family={family} printContentRef={printContentRef} />
        </Grid>
        <Grid item md={8}>
          <Grid container spacing={2}>
            <Grid item md={4}>
              <PrimaryContactEditor family={family} />
            </Grid>
            <Grid item md={8}>
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
            </Grid>

            <Grid item xs={12}>
              <Typography
                className="ph-unmask"
                variant="h3"
                style={{ marginTop: 0, marginBottom: 0 }}
              >
                Communities
              </Typography>

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

            {family && <AssignmentsSection family={family} />}

            <Grid item xs={12} md={4}>
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
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        gap={2}
                      >
                        <Typography className="ph-unmask" variant="h3">
                          Referrals
                        </Typography>
                        {!family.partneringFamilyInfo?.openReferral &&
                          permissions(Permission.CreateReferral) && (
                            <Button
                              className="ph-unmask"
                              onClick={() => setOpenNewReferralDialogOpen(true)}
                              variant="contained"
                              size="small"
                            >
                              Open New Referral
                            </Button>
                          )}
                      </Box>
                    </FormLabel>

                    <RadioGroup
                      aria-labelledby="demo-radio-buttons-group-label"
                      value={selectedReferral ? selectedReferral.id : null}
                      name="radio-buttons-group"
                    >
                      {allReferrals.map((referral) => {
                        const isSelected = selectedReferral?.id === referral.id;
                        const isOpenReferral = !referral.closedAtUtc;
                        const showCloseButton =
                          isSelected &&
                          isOpenReferral &&
                          canCloseReferral &&
                          referral.id ===
                            family.partneringFamilyInfo?.openReferral?.id;

                        return (
                          <FormControlLabel
                            key={referral.id}
                            value={referral.id}
                            control={<Radio />}
                            onChange={() => {
                              if (referral.id)
                                handleReferralChange(referral.id);
                            }}
                            label={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography className="ph-unmask">
                                  {referral.closedAtUtc
                                    ? `Referral Closed ${format(referral.closedAtUtc, 'M/d/yy')}`
                                    : 'Open Referral'}
                                </Typography>
                                {showCloseButton && (
                                  <Button
                                    className="ph-unmask"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCloseReferralDialogOpen(true);
                                    }}
                                    variant="contained"
                                    size="small"
                                  >
                                    Close Referral
                                  </Button>
                                )}
                              </Box>
                            }
                          />
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                )}
            </Grid>

            <Grid item md={4}>
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

            <Grid item md={12}>
              {permissions(Permission.ViewReferralComments) &&
                selectedReferral && (
                  <Grid container spacing={0}>
                    <ReferralComments
                      partneringFamily={family}
                      referralId={selectedReferral.id!}
                    />
                  </Grid>
                )}
            </Grid>
          </Grid>

          <Grid container spacing={0}>
            {permissions(Permission.ViewReferralProgress) &&
              selectedReferral && (
                <>
                  <Grid item xs={12} sm={6} md={4} style={{ paddingRight: 20 }}>
                    <Typography
                      className="ph-unmask"
                      variant="h3"
                      style={{ marginBottom: 0 }}
                    >
                      Incomplete
                    </Typography>
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
                  <Grid item xs={12} sm={6} md={4} style={{ paddingRight: 20 }}>
                    <Typography
                      className="ph-unmask"
                      variant="h3"
                      style={{ marginBottom: 0 }}
                    >
                      Completed
                    </Typography>
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
                        status={roleApprovalStatus.effectiveRoleApprovalStatus}
                      />
                    ))}
                    {(family.volunteerFamilyInfo?.roleRemovals || []).map(
                      (removedRole) => (
                        <Chip
                          key={removedRole.roleName}
                          size="small"
                          label={`${removedRole.roleName} - ${
                            RoleRemovalReason[removedRole.reason!]
                          } - ${removedRole.additionalComments}${
                            removedRole.effectiveSince
                              ? ' - effective ' +
                                format(removedRole.effectiveSince, 'M/d/yy')
                              : ''
                          }${
                            removedRole.effectiveUntil
                              ? ' - through ' +
                                format(removedRole.effectiveUntil, 'M/d/yy')
                              : ''
                          }`}
                        />
                      )
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4} style={{ paddingRight: 20 }}>
                  <Typography className="ph-unmask" variant="h3">
                    Incomplete
                  </Typography>
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
                  <Typography className="ph-unmask" variant="h3">
                    Completed
                  </Typography>
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
                <Typography
                  className="ph-unmask"
                  variant="h3"
                  style={{ marginBottom: 0 }}
                >
                  Documents
                </Typography>
                <FamilyDocuments family={family} />
              </Grid>
            )}
          </Grid>
          <Grid container spacing={0}>
            {selectedReferral && (
              <ArrangementsSection
                referral={selectedReferral}
                family={family}
                permissions={permissions}
              />
            )}

            <Grid item xs={12}>
              <Typography
                className="ph-unmask"
                variant="h3"
                style={{ marginBottom: 0 }}
              >
                Family Members
              </Typography>
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
    </Container>
  );
}
