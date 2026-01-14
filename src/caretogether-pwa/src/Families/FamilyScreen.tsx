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
  V1Case,
  RoleRemovalReason,
  V1ReferralStatus,
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
import { CloseV1CaseDialog } from '../V1Cases/CloseV1CaseDialog';
import { OpenNewV1CaseDialog } from '../V1Cases/OpenNewV1CaseDialog';
import { FamilyDocuments } from './FamilyDocuments';
import { useFamilyPermissions } from '../Model/SessionModel';
import { Masonry } from '@mui/lab';
import { MissingRequirementRow } from '../Requirements/MissingRequirementRow';
import { ExemptedRequirementRow } from '../Requirements/ExemptedRequirementRow';
import { CompletedRequirementRow } from '../Requirements/CompletedRequirementRow';
import {
  V1CaseContext as V1CaseContext,
  VolunteerFamilyContext,
} from '../Requirements/RequirementContext';
import { ActivityTimeline } from '../Activities/ActivityTimeline';
import { V1CaseComments } from '../V1Cases/V1CaseComments';
import { PrimaryContactEditor } from './PrimaryContactEditor';
import {
  useScreenTitleComponent,
  useScreenTitle,
} from '../Shell/ShellScreenTitle';
import {
  useCommunityLookup,
  useFamilyLookup,
  useDirectoryModel,
} from '../Model/DirectoryModel';
import { RemoveFamilyRoleDialog } from '../Volunteers/RemoveFamilyRoleDialog';
import { ResetFamilyRoleDialog } from '../Volunteers/ResetFamilyRoleDialog';
import { VolunteerRoleApprovalStatusChip } from '../Volunteers/VolunteerRoleApprovalStatusChip';
import { FamilyCustomField } from './FamilyCustomField';
import { isBackdropClick } from '../Utilities/handleBackdropClick';
import { DeleteFamilyDialog } from './DeleteFamilyDialog';
import { useDialogHandle } from '../Hooks/useDialogHandle';
import { familyLastName } from './FamilyUtils';
import { useLoadable } from '../Hooks/useLoadable';
import { visibleCommunitiesQuery, visibleReferralsQuery } from '../Model/Data';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import FamilyScreenPageVersionSwitch from './FamilyScreenPageVersionSwitch';
import posthog from 'posthog-js';
import { AssignmentsSection } from '../Families/AssignmentsSection';
import { useMemo } from 'react';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useSyncV1CaseIdInURL } from '../Hooks/useSyncV1CaseIdInURL';
import { ArrangementsSection } from '../V1Cases/Arrangements/ArrangementsSection/ArrangementsSection';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { TestFamilyBadge } from './TestFamilyBadge';
import { useRecoilValue } from 'recoil';

export function FamilyScreen() {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;

  const searchParams = new URLSearchParams(location.search);
  const v1CaseIdFromQuery = searchParams.get('v1CaseId') ?? undefined;

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

  const referrals = useRecoilValue(visibleReferralsQuery);

  const appNavigate = useAppNavigate();

  const familyLookup = useFamilyLookup();
  const family = familyLookup(familyId);

  const directoryModel = useDirectoryModel();

  const withBackdrop = useBackdrop();

  const permissions = useFamilyPermissions(family);

  const canCloseV1Case =
    family?.partneringFamilyInfo?.openV1Case &&
    !family.partneringFamilyInfo.openV1Case.closeReason &&
    !family.partneringFamilyInfo.openV1Case.arrangements?.some(
      (arrangement) => !arrangement.endedAtUtc && !arrangement.cancelledAtUtc
    ) &&
    permissions(Permission.CloseV1Case);

  const deleteFamilyDialogHandle = useDialogHandle();
  const openV1Cases: V1Case[] = useMemo(() => {
    return family?.partneringFamilyInfo?.openV1Case !== undefined
      ? [family.partneringFamilyInfo.openV1Case]
      : [];
  }, [family?.partneringFamilyInfo?.openV1Case]);

  const closedV1Cases: V1Case[] = useMemo(() => {
    return family?.partneringFamilyInfo?.closedV1Cases === undefined
      ? []
      : [...family.partneringFamilyInfo.closedV1Cases!].sort(
          (r1, r2) =>
            r1.closedAtUtc!.getUTCMilliseconds() -
            r2.closedAtUtc!.getUTCMilliseconds()
        );
  }, [family?.partneringFamilyInfo?.closedV1Cases]);

  const familyReferrals = useMemo(() => {
    return referrals.filter((referral) => referral.familyId === familyId);
  }, [referrals, familyId]);

  const allV1Cases: V1Case[] = useMemo(() => {
    return [...openV1Cases, ...closedV1Cases];
  }, [openV1Cases, closedV1Cases]);
  const [closeV1CaseDialogOpen, setCloseV1CaseDialogOpen] = useState(false);
  const [openNewV1CaseDialogOpen, setOpenNewV1CaseDialogOpen] = useState(false);
  const [uploadDocumentDialogOpen, setUploadDocumentDialogOpen] =
    useState(false);
  const [addAdultDialogOpen, setAddAdultDialogOpen] = useState(false);
  const [addChildDialogOpen, setAddChildDialogOpen] = useState(false);
  const [addNoteDialogOpen, setAddNoteDialogOpen] = useState(false);

  const firstV1CaseId = allV1Cases.length > 0 ? allV1Cases[0].id : undefined;

  const [selectedV1CaseId, setSelectedV1CaseId] = useState<string | undefined>(
    v1CaseIdFromQuery || firstV1CaseId
  );

  const selectedV1Case = allV1Cases.find(
    (v1Case) => v1Case.id === selectedV1CaseId
  );

  useEffect(() => {
    if (
      v1CaseIdFromQuery &&
      allV1Cases.some((ref) => ref.id === v1CaseIdFromQuery)
    ) {
      setSelectedV1CaseId(v1CaseIdFromQuery);
    }
  }, [v1CaseIdFromQuery, allV1Cases]);

  // If user navigates to a different family without leaving current page (i.e. not unmounting this component),
  // we want to auto-select the first v1Case
  useEffect(() => {
    if (!selectedV1Case) {
      posthog.capture('auto selected first v1Case');

      if (firstV1CaseId) {
        setSelectedV1CaseId(firstV1CaseId);
      }
    }
  }, [firstV1CaseId, selectedV1Case]);

  useSyncV1CaseIdInURL({
    familyId,
    v1CaseIdFromQuery,
    selectedV1CaseId,
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hasArrangementId = searchParams.has('arrangementId');

    if (hasArrangementId) {
      appNavigate.family(
        familyId,
        searchParams.get('v1CaseId') ?? undefined,
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

  let v1CaseRequirementContext: V1CaseContext | undefined;
  if (selectedV1Case) {
    v1CaseRequirementContext = {
      kind: 'V1Case',
      partneringFamilyId: familyId,
      v1CaseId: selectedV1Case.id!,
    };
  }

  const volunteerFamilyRequirementContext: VolunteerFamilyContext = {
    kind: 'Volunteer Family',
    volunteerFamilyId: familyId,
  };

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
  const isWideScreen = useMediaQuery(theme.breakpoints.up('xl'));

  const updateTestFamilyFlagEnabled = useFeatureFlagEnabled(
    'updateTestFamilyFlag'
  );

  useScreenTitle(family ? `${familyLastName(family)} Family` : '...');
  useScreenTitleComponent(family ? <TestFamilyBadge family={family} /> : null);

  function handleV1CaseChange(v1CaseId: string) {
    setSelectedV1CaseId(v1CaseId);
  }

  const printContentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef: printContentRef });

  if (!family) {
    return (
      <Box mt={10} textAlign="center">
        <Typography>
          Oops! You can’t view this family. It may be restricted or unavailable.
        </Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => appNavigate.dashboard()}
        >
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

            {permissions(Permission.EditFamilyInfo) &&
              updateTestFamilyFlagEnabled && (
                <MenuItem
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    setFamilyMoreMenuAnchor(null);

                    try {
                      const isCurrentlyTest =
                        family.family?.isTestFamily ?? false;
                      await withBackdrop(async () => {
                        await directoryModel.updateTestFamilyFlag(
                          family.family.id,
                          !isCurrentlyTest
                        );
                      });
                    } catch (error) {
                      console.error(error);
                    }
                  }}
                >
                  <ListItemText
                    className="ph-unmask"
                    primary={
                      family.family?.isTestFamily
                        ? 'Unmark as test family'
                        : 'Mark as test family'
                    }
                  />
                </MenuItem>
              )}

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
                Array<CompletedCustomFieldInfo | string>()
                  .concat(family.family!.completedCustomFields)
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

            {familyReferrals.length > 0 && (
              <Grid item xs={12}>
                <Typography
                  className="ph-unmask"
                  variant="h3"
                  style={{ marginTop: 16, marginBottom: 8 }}
                >
                  Referrals
                </Typography>

                {familyReferrals.map((referral) => {
                  const date =
                    referral.status === V1ReferralStatus.Open
                      ? referral.createdAtUtc
                      : referral.closedAtUtc;

                  return (
                    <Box
                      key={referral.referralId}
                      onClick={() => appNavigate.referral(referral.referralId)}
                      sx={{
                        cursor: 'pointer',
                        py: 0.5,
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      <Typography className="ph-unmask">
                        {referral.title}{' '}
                        <Typography component="span" color="text.secondary">
                          ·{' '}
                          {referral.status === V1ReferralStatus.Open
                            ? 'Open'
                            : 'Closed'}{' '}
                          · {date ? format(date, 'M/d/yy') : ''}
                        </Typography>
                      </Typography>
                    </Box>
                  );
                })}
              </Grid>
            )}

            {family && <AssignmentsSection family={family} />}

            <Grid item xs={12} md={4}>
              {permissions(Permission.ViewV1CaseProgress) &&
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
                          Cases
                        </Typography>
                        {!family.partneringFamilyInfo?.openV1Case &&
                          permissions(Permission.CreateV1Case) && (
                            <Button
                              className="ph-unmask"
                              onClick={() => setOpenNewV1CaseDialogOpen(true)}
                              variant="contained"
                              size="small"
                            >
                              Open New Case
                            </Button>
                          )}
                      </Box>
                    </FormLabel>

                    <RadioGroup
                      aria-labelledby="demo-radio-buttons-group-label"
                      value={selectedV1Case ? selectedV1Case.id : null}
                      name="radio-buttons-group"
                    >
                      {allV1Cases.map((v1Case) => {
                        const isSelected = selectedV1Case?.id === v1Case.id;
                        const isOpenV1Case = !v1Case.closedAtUtc;
                        const showCloseButton =
                          isSelected &&
                          isOpenV1Case &&
                          canCloseV1Case &&
                          v1Case.id ===
                            family.partneringFamilyInfo?.openV1Case?.id;

                        return (
                          <FormControlLabel
                            key={v1Case.id}
                            value={v1Case.id}
                            control={<Radio />}
                            onChange={() => {
                              if (v1Case.id) handleV1CaseChange(v1Case.id);
                            }}
                            label={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography className="ph-unmask">
                                  {v1Case.closedAtUtc
                                    ? `Case Closed ${format(v1Case.closedAtUtc, 'M/d/yy')}`
                                    : 'Open Case'}
                                </Typography>
                                {showCloseButton && (
                                  <Button
                                    className="ph-unmask"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCloseV1CaseDialogOpen(true);
                                    }}
                                    variant="contained"
                                    size="small"
                                  >
                                    Close Case
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

            <Grid item md={4}></Grid>

            <Grid item xs={6} md={4}>
              {closeV1CaseDialogOpen &&
                selectedV1Case?.id ===
                  family.partneringFamilyInfo?.openV1Case?.id && (
                  <CloseV1CaseDialog
                    partneringFamilyId={family.family!.id!}
                    v1CaseId={`${selectedV1Case!.id}`}
                    onClose={() => setCloseV1CaseDialogOpen(false)}
                  />
                )}
              {openNewV1CaseDialogOpen && (
                <OpenNewV1CaseDialog
                  partneringFamilyId={family.family!.id!}
                  onClose={() => setOpenNewV1CaseDialogOpen(false)}
                />
              )}
            </Grid>

            <Grid item md={12}>
              {permissions(Permission.ViewV1CaseComments) && selectedV1Case && (
                <Grid container spacing={0}>
                  <V1CaseComments
                    partneringFamily={family}
                    v1CaseId={selectedV1Case.id!}
                  />
                </Grid>
              )}
            </Grid>
          </Grid>

          <Grid container spacing={0}>
            {permissions(Permission.ViewV1CaseProgress) && selectedV1Case && (
              <>
                <Grid item xs={12} sm={6} md={4} style={{ paddingRight: 20 }}>
                  <Typography
                    className="ph-unmask"
                    variant="h3"
                    style={{ marginBottom: 0 }}
                  >
                    Incomplete
                  </Typography>
                  {selectedV1Case?.missingRequirements?.map((missing, i) => (
                    <MissingRequirementRow
                      key={`${missing}:${i}`}
                      requirement={missing}
                      context={v1CaseRequirementContext!}
                      v1CaseId={selectedV1Case.id}
                    />
                  ))}
                </Grid>
                <Grid item xs={12} sm={6} md={4} style={{ paddingRight: 20 }}>
                  <Typography
                    className="ph-unmask"
                    variant="h3"
                    style={{ marginBottom: 0 }}
                  >
                    Completed
                  </Typography>
                  {selectedV1Case?.completedRequirements?.map(
                    (completed, i) => (
                      <CompletedRequirementRow
                        key={`${completed.completedRequirementId}:${i}`}
                        requirement={completed}
                        context={v1CaseRequirementContext!}
                      />
                    )
                  )}
                  {selectedV1Case?.exemptedRequirements?.map((exempted, i) => (
                    <ExemptedRequirementRow
                      key={`${exempted.requirementName}:${i}`}
                      requirement={exempted}
                      context={v1CaseRequirementContext!}
                    />
                  ))}
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
                        requirement={missing.item1 || ''}
                        policyVersions={missing.item2?.map((v) => ({
                          version: v.item1 ?? '',
                          roleName: v.item2 ?? '',
                        }))}
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
            {selectedV1Case && (
              <ArrangementsSection
                v1Case={selectedV1Case}
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
