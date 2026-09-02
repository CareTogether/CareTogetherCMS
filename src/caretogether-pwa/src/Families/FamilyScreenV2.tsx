import Grid from '../Generic/GridLegacyCompat';
import { useReactToPrint } from 'react-to-print';
import {
  Container,
  Button,
  useMediaQuery,
  useTheme,
  Box,
  Chip,
  Typography,
  Tooltip,
} from '@mui/material';
import {
  Permission,
  V1Referral,
  RoleRemovalReason,
  Note,
} from '../GeneratedClient';
import { useParams } from 'react-router';
import {
  Check as CheckIcon,
  DeleteForever as DeleteForeverIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useFamilyPermissions,
  useGlobalPermissions,
} from '../Model/SessionModel';
import { V1CaseContext } from '../Requirements/RequirementContext';
import { ActivityTimelineV2 } from '../Activities/ActivityTimelineV2';
import {
  useScreenTitleComponent,
  useScreenTitle,
} from '../Shell/ShellScreenTitle';
import {
  useFamilyLookup,
  useNoteAuthorLookup,
  useUserLookup,
  useDirectoryModel,
} from '../Model/DirectoryModel';
import { isBackdropClick } from '../Utilities/handleBackdropClick';
import { useDialogHandle } from '../Hooks/useDialogHandle';
import {
  useRequiredSelectedLocationContext,
  useVisibleReferrals,
} from '../Model/Data';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { AssignmentsSection } from '../Families/AssignmentsSectionV2';
import { useBackdrop } from '../Hooks/useBackdrop';
import { ArrangementsSection } from '../V1Cases/Arrangements/ArrangementsSection/ArrangementsSectionV2';
import type { ArrangementRowV2 } from '../V1Cases/Arrangements/arrangementViewModel';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { TestFamilyBadge } from './TestFamilyBadge';
import { useV1CasesModel } from '../Model/V1CasesModel';
import { usePolicy } from '../Model/PolicyModel';
import {
  FAMILY_MEMBER_PRINT_INFORMATION_FEATURE_FLAG,
  REFERRALS_FEATURE_FLAG,
  UPDATE_TEST_FAMILY_FEATURE_FLAG,
} from '../featureFlags';
import { personNameString } from './PersonName';
import { useGlobalSnackBar } from '../Hooks/useGlobalSnackBar';
import { ApprovalLedgerSection } from './ApprovalLedgerSection';
import { RoleSummaryCardsSection } from './RoleSummaryCardsSection';
import { useAccountInfo } from '../Authentication/Auth';
import {
  personFullName,
  type PrintableFamilyMember,
} from './FamilyMemberPrintData';
import { FamilyMemberPrintDocument } from './FamilyMemberPrintDocument';
import { FamilyScreenActionsMenuV2 } from './FamilyScreenActionsMenuV2';
import { FamilyPrimaryHeaderInfoV2 } from './FamilyPrimaryHeaderInfoV2';
import { FamilyCaseWorkspaceHeaderV2 } from './FamilyCaseWorkspaceHeaderV2';
import { FamilyCaseHistoryTabV2 } from './FamilyCaseHistoryTabV2';
import { FamilyOverviewTabV2 } from './FamilyOverviewTabV2';
import {
  FamilyScreenTab,
  FamilyScreenTabsV2,
} from './FamilyScreenTabsV2';
import {
  FamilyPinnedNotesV2,
  RecentOverviewTimelineItem,
} from './FamilyRecentOverviewV2';
import { FamilyScreenWorkflowCoordinatorV2 } from './FamilyScreenWorkflowCoordinatorV2';
import { FamilyMemberRowV2 } from './familyMemberViewModel';
import { FamilyDocumentsSectionV2 } from './FamilyDocumentsSectionV2';
import { UploadFamilyDocumentsDrawerV2 } from './UploadFamilyDocumentsDrawerV2';
import { useFamilyApprovalViewModel } from './useFamilyApprovalViewModel';
import { useFamilyCommunitiesViewModel } from './useFamilyCommunitiesViewModel';
import { useFamilyHeaderViewModel } from './useFamilyHeaderViewModel';
import { useFamilyOverviewViewModel } from './useFamilyOverviewViewModel';
import { useFamilyScreenTabsViewModel } from './useFamilyScreenTabsViewModel';
import { useRecentFamilyNoteActions } from './useRecentFamilyNoteActions';
import { useFamilyActionsMenuViewModel } from './useFamilyActionsMenuViewModel';
import { useFamilyCaseSelectionController } from './useFamilyCaseSelectionController';

type ReferralNoteEntry = NonNullable<V1Referral['notes']>[number];
type RecentNoteAction = 'edit' | 'approve' | 'delete';

export function FamilyScreenV2() {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;

  const {
    addCommunityCandidateCommunities,
    canAddCommunity,
    familyCommunityInfo,
  } = useFamilyCommunitiesViewModel(familyId);

  const referralInfos = useVisibleReferrals();
  const { organizationId, locationId } = useRequiredSelectedLocationContext();

  const familyReferrals = useMemo(() => {
    return (referralInfos ?? [])
      .map((referralInfo) => referralInfo.referral)
      .filter((r) => r.familyId === familyId);
  }, [referralInfos, familyId]);

  const appNavigate = useAppNavigate();

  const familyLookup = useFamilyLookup();
  const noteAuthorLookup = useNoteAuthorLookup();
  const userLookup = useUserLookup();
  const familyDocumentUploaderLabel = useCallback(
    (userId?: string) =>
      userId ? personNameString(userLookup(userId)) : undefined,
    [userLookup]
  );
  const family = familyLookup(familyId);
  const policy = usePolicy();
  const currentUserId = useAccountInfo()?.userId;

  const directoryModel = useDirectoryModel();

  const withBackdrop = useBackdrop();
  const { setAndShowGlobalSnackBar } = useGlobalSnackBar();

  const permissions = useFamilyPermissions(family);
  const globalPermissions = useGlobalPermissions();
  const { getFamilyNoteActions, getReferralNoteActions } =
    useRecentFamilyNoteActions({
      currentUserId,
      familyPermissions: permissions,
      globalPermissions,
    });

  const canCloseV1Case =
    family?.partneringFamilyInfo?.openV1Case &&
    !family.partneringFamilyInfo.openV1Case.closeReason &&
    !family.partneringFamilyInfo.openV1Case.arrangements?.some(
      (arrangement) => !arrangement.endedAtUtc && !arrangement.cancelledAtUtc
    ) &&
    permissions(Permission.CloseV1Case);

  const deleteFamilyDialogHandle = useDialogHandle();
  const {
    activeCaseArrangements,
    allV1Cases,
    arrangementIdToScrollTo,
    caseReferralTable,
    currentReferral,
    hasOpenV1Case,
    latestClosedV1Case,
    openReferralId,
    selectedArrangementRow,
    selectedCaseArrangementRows,
    selectedTab,
    selectedV1Case,
    setSelectedArrangementRowId,
    setSelectedTab,
    setSelectedV1CaseId,
  } = useFamilyCaseSelectionController({
    family,
    familyId,
    familyReferrals,
    policy,
  });
  const [closeCaseDrawerOpen, setCloseCaseDrawerOpen] = useState(false);
  const v1CasesModel = useV1CasesModel();
  const [openNewV1CaseDialogOpen, setOpenNewV1CaseDialogOpen] = useState(false);
  const [uploadDocumentDialogOpen, setUploadDocumentDialogOpen] =
    useState(false);
  const [addAdultDialogOpen, setAddAdultDialogOpen] = useState(false);
  const [addChildDialogOpen, setAddChildDialogOpen] = useState(false);
  const [addCommunityDrawerOpen, setAddCommunityDrawerOpen] = useState(false);
  const [selectedFamilyMemberRowId, setSelectedFamilyMemberRowId] = useState<
    string | null
  >(null);
  const [addNoteDialogOpen, setAddNoteDialogOpen] = useState(false);
  const [recentFamilyNoteAction, setRecentFamilyNoteAction] = useState<{
    action: RecentNoteAction;
    note: Note;
  } | null>(null);
  const [recentReferralNoteAction, setRecentReferralNoteAction] = useState<{
    action: RecentNoteAction;
    referralId: string;
    note: ReferralNoteEntry;
  } | null>(null);
  const [selectedRoleSummaryCardId, setSelectedRoleSummaryCardId] = useState<
    string | null
  >(null);
  const [selectedRemovedRoleId, setSelectedRemovedRoleId] = useState<
    string | null
  >(null);
  const canReopenSelectedV1Case =
    !!selectedV1Case?.closedAtUtc &&
    !hasOpenV1Case &&
    selectedV1Case.id === latestClosedV1Case?.id &&
    permissions(Permission.CloseV1Case);

  function openArrangementWorkspace(row: ArrangementRowV2) {
    setSelectedArrangementRowId(row.id);
  }

  async function reopenCaseNow() {
    if (!selectedV1Case?.id) return;

    await withBackdrop(async () => {
      const reopenedAtLocal = new Date();

      await v1CasesModel.reopenV1Case(
        familyId,
        selectedV1Case.id,
        reopenedAtLocal
      );
    });
  }

  const [familyMoreMenuAnchor, setFamilyMoreMenuAnchor] =
    useState<Element | null>(null);

  const [familyCompleteOtherOpen, setFamilyCompleteOtherOpen] = useState(false);

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

  const v1CaseRequirementContext: V1CaseContext | undefined = selectedV1Case
    ? {
        kind: 'V1Case',
        partneringFamilyId: familyId,
        v1CaseId: selectedV1Case.id!,
      }
    : undefined;

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));

  const updateTestFamilyFlagEnabled = useFeatureFlagEnabled(
    UPDATE_TEST_FAMILY_FEATURE_FLAG
  );
  const referralsEnabled = useFeatureFlagEnabled(REFERRALS_FEATURE_FLAG);
  const familyMemberPrintInformationEnabled =
    useFeatureFlagEnabled(FAMILY_MEMBER_PRINT_INFORMATION_FEATURE_FLAG) ===
    true;
  const canViewFamilyCustomFields = permissions(
    Permission.ViewFamilyCustomFields
  );
  const canViewV1CaseCustomFields =
    permissions(Permission.ViewV1CaseCustomFields) && !referralsEnabled;
  const {
    primaryAddressText,
    primaryEmailAddress,
    primaryPhoneNumber,
    screenTitle,
  } = useFamilyHeaderViewModel(family);

  useScreenTitle(screenTitle);
  useScreenTitleComponent(family ? <TestFamilyBadge family={family} /> : null);

  function openUploadDocumentDialog() {
    setFamilyMoreMenuAnchor(null);
    setUploadDocumentDialogOpen(true);
  }

  function openAddAdultDialog() {
    setFamilyMoreMenuAnchor(null);
    setAddAdultDialogOpen(true);
  }

  function openAddChildDialog() {
    setFamilyMoreMenuAnchor(null);
    setAddChildDialogOpen(true);
  }

  function openAddCommunityDrawer() {
    setAddCommunityDrawerOpen(true);
  }

  function openFamilyMemberDrawer(row: FamilyMemberRowV2) {
    setSelectedFamilyMemberRowId(row.id);
  }

  function openAddNoteDialog() {
    setFamilyMoreMenuAnchor(null);
    setAddNoteDialogOpen(true);
  }

  const printContentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef: printContentRef });
  const familyMemberPrintContentRef = useRef<HTMLDivElement>(null);
  const [familyMemberToPrint, setFamilyMemberToPrint] =
    useState<PrintableFamilyMember | null>(null);
  const [familyMemberPrintRequested, setFamilyMemberPrintRequested] =
    useState(false);
  const printFamilyMemberFn = useReactToPrint({
    contentRef: familyMemberPrintContentRef,
    documentTitle: () =>
      familyMemberToPrint
        ? `${personFullName(familyMemberToPrint.person)} information`
        : 'Family member information',
    preserveAfterPrint: true,
  });
  const isVolunteerFamily = family?.volunteerFamilyInfo != null;
  const isPartneringFamily = family?.partneringFamilyInfo != null;
  const {
    activeAdults,
    activeChildren,
    familyMemberPrintCustomFieldSections,
    familyMemberRows,
    overviewCommunityRows,
    overviewFamilyCustomFields,
    overviewV1CaseCustomFields,
    overviewVolunteerFamilyCustomFields,
    pinnedNotes,
    printableFamilyMembers,
    recentOverviewTimelineItems,
  } = useFamilyOverviewViewModel({
    allV1Cases,
    canViewFamilyCustomFields,
    canViewV1CaseCustomFields,
    family,
    familyCommunityInfo,
    familyMemberToPrint,
    familyReferrals,
    permissions,
    policy,
    selectedV1Case,
  });
  const familyActionsMenu = useFamilyActionsMenuViewModel({
    family,
    familyMemberPrintInformationEnabled,
    permissions,
    printableFamilyMembers,
    updateTestFamilyFlagEnabled,
  });
  const selectedFamilyMemberRow = useMemo(
    () =>
      familyMemberRows.find((row) => row.id === selectedFamilyMemberRowId) ??
      null,
    [familyMemberRows, selectedFamilyMemberRowId]
  );
  const {
    approvalAttentionCounts,
    approvalLedgerRows,
    removedRoleSummaries,
    roleSummaryCards,
    selectedRemovedRole,
    selectedRoleSummaryCard,
  } = useFamilyApprovalViewModel({
    family,
    familyId,
    selectedRemovedRoleId,
    selectedRoleSummaryCardId,
  });
  const {
    selectedTabIsInvalid,
    showApprovals,
    showArrangementsOrAssignments,
    showCaseHistory,
    showDocuments,
    showOverview,
    showTimelineAndNotes,
    tabs: familyScreenTabModels,
  } = useFamilyScreenTabsViewModel({
    allV1Cases,
    family,
    familyReferrals,
    selectedTab,
    selectedV1Case,
  });

  useEffect(() => {
    if (!familyMemberPrintRequested || !familyMemberToPrint) return;

    const frame = requestAnimationFrame(() => {
      printFamilyMemberFn();
      setFamilyMemberPrintRequested(false);
    });

    return () => cancelAnimationFrame(frame);
  }, [familyMemberPrintRequested, familyMemberToPrint, printFamilyMemberFn]);

  function printFamilyMemberInformation(member: PrintableFamilyMember) {
    setFamilyMoreMenuAnchor(null);
    setFamilyMemberToPrint(member);
    setFamilyMemberPrintRequested(true);
  }

  async function toggleTestFamilyFlag() {
    if (!family) return;

    setFamilyMoreMenuAnchor(null);

    const isCurrentlyTest = family.family?.isTestFamily ?? false;
    await withBackdrop(async () => {
      await directoryModel.updateTestFamilyFlag(
        family.family.id,
        !isCurrentlyTest
      );
    });
  }

  function tabLabel(label: string, count?: number, unapprovedCount?: number) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <span className="ph-unmask">{label}</span>
        {count !== undefined && (
          <Chip
            className="ph-unmask"
            size="small"
            variant="outlined"
            label={count}
            sx={{ height: 20, '& .MuiChip-label': { px: 0.75 } }}
          />
        )}
        {unapprovedCount !== undefined && unapprovedCount > 0 && (
          <Chip
            className="ph-unmask"
            size="small"
            color="warning"
            label={`${unapprovedCount} Awaiting Review`}
            sx={{ height: 20, '& .MuiChip-label': { px: 0.75 } }}
          />
        )}
      </Box>
    );
  }

  function approvalTabLabel(label: string) {
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
          {label}
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

  function approvalMobileTabLabel(label: string) {
    const details = [
      approvalAttentionCounts.missing > 0
        ? `${approvalAttentionCounts.missing} missing`
        : null,
      approvalAttentionCounts.expired > 0
        ? `${approvalAttentionCounts.expired} expired`
        : null,
    ].filter(Boolean);

    return details.length === 0 ? label : `${label} (${details.join(', ')})`;
  }

  function mobileTabLabel(
    label: string,
    count?: number,
    unapprovedCount?: number
  ) {
    const details = [
      count !== undefined ? `${count}` : null,
      unapprovedCount !== undefined && unapprovedCount > 0
        ? `${unapprovedCount} Awaiting Review`
        : null,
    ].filter(Boolean);

    return details.length === 0 ? label : `${label} (${details.join(', ')})`;
  }

  const familyScreenTabs: FamilyScreenTab[] = familyScreenTabModels.map(
    (tab) => ({
      value: tab.value,
      label: tab.label,
      desktopLabel:
        tab.value === 'approvals'
          ? approvalTabLabel(tab.label)
          : tab.count === undefined && tab.unapprovedCount === undefined
            ? tab.label
            : tabLabel(tab.label, tab.count, tab.unapprovedCount),
      mobileLabel:
        tab.value === 'approvals'
          ? approvalMobileTabLabel(tab.label)
          : mobileTabLabel(tab.label, tab.count, tab.unapprovedCount),
    })
  );

  useEffect(() => {
    if (selectedTabIsInvalid) {
      setSelectedTab('overview');
    }
  }, [selectedTabIsInvalid, setSelectedTab]);

  if (!family) {
    return (
      <Box sx={{ mt: 10, textAlign: 'center' }}>
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

  const showV1CaseRequirements =
    permissions(Permission.ViewV1CaseProgress) &&
    !referralsEnabled &&
    selectedV1Case !== undefined &&
    v1CaseRequirementContext !== undefined;

  function renderRecentNoteActions(item: RecentOverviewTimelineItem) {
    if (item.note) {
      const { canDelete, canEdit, canApprove, hasActions } =
        getFamilyNoteActions(item.note);

      if (!hasActions) return null;

      return (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          {canDelete && (
            <Button
              className="ph-unmask"
              size="small"
              color="error"
              startIcon={<DeleteForeverIcon />}
              onClick={() =>
                setRecentFamilyNoteAction({
                  action: 'delete',
                  note: item.note!,
                })
              }
            >
              Delete
            </Button>
          )}
          {canEdit && (
            <Button
              className="ph-unmask"
              size="small"
              startIcon={<EditIcon />}
              onClick={() =>
                setRecentFamilyNoteAction({
                  action: 'edit',
                  note: item.note!,
                })
              }
            >
              Edit
            </Button>
          )}
          {canApprove && (
            <Button
              className="ph-unmask"
              size="small"
              startIcon={<CheckIcon />}
              onClick={() =>
                setRecentFamilyNoteAction({
                  action: 'approve',
                  note: item.note!,
                })
              }
            >
              Approve
            </Button>
          )}
        </Box>
      );
    }

    const { hasActions } = getReferralNoteActions(
      item.referralId,
      item.referralNote
    );

    if (!hasActions) {
      return null;
    }

    return (
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
        <Button
          className="ph-unmask"
          size="small"
          color="error"
          startIcon={<DeleteForeverIcon />}
          onClick={() =>
            setRecentReferralNoteAction({
              action: 'delete',
              referralId: item.referralId!,
              note: item.referralNote!,
            })
          }
        >
          Delete
        </Button>
        <Button
          className="ph-unmask"
          size="small"
          startIcon={<EditIcon />}
          onClick={() =>
            setRecentReferralNoteAction({
              action: 'edit',
              referralId: item.referralId!,
              note: item.referralNote!,
            })
          }
        >
          Edit
        </Button>
        <Button
          className="ph-unmask"
          size="small"
          startIcon={<CheckIcon />}
          onClick={() =>
            setRecentReferralNoteAction({
              action: 'approve',
              referralId: item.referralId!,
              note: item.referralNote!,
            })
          }
        >
          Approve
        </Button>
      </Box>
    );
  }

  const roleRemovalActions = familyActionsMenu.roleRemovalActions.map(
    (action) => ({
      key: action.key,
      label: action.label,
      onClick: () => selectRemoveRole(action.role),
    })
  );
  const roleResetActions = familyActionsMenu.roleResetActions.map((action) => ({
    key: action.key,
    label: action.label,
    onClick: () =>
      selectResetRole(
        action.role,
        action.removalReason,
        action.removalAdditionalComments
      ),
  }));

  return (
    <Container maxWidth={false} sx={{ paddingLeft: '12px' }}>
      {familyMemberPrintInformationEnabled && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: '-10000px',
            width: '8.5in',
            backgroundColor: '#fff',
          }}
        >
          <div ref={familyMemberPrintContentRef}>
            <FamilyMemberPrintDocument
              member={familyMemberToPrint}
              canViewDateOfBirth={permissions(Permission.ViewPersonDateOfBirth)}
              familyAdults={activeAdults.map((member) => member.person)}
              familyChildren={activeChildren.map((member) => member.person)}
              custodialRelationships={
                family.family?.custodialRelationships ?? []
              }
              customFieldSections={familyMemberPrintCustomFieldSections}
            />
          </div>
        </Box>
      )}
      <FamilyScreenActionsMenuV2
        canAddNotes={familyActionsMenu.canAddNotes}
        canEditFamilyInfo={familyActionsMenu.canEditFamilyInfo}
        canUploadDocuments={familyActionsMenu.canUploadDocuments}
        familyMemberPrintInformationEnabled={
          familyMemberPrintInformationEnabled
        }
        hasFamilyActions={familyActionsMenu.hasFamilyActions}
        hasMoreMenuActions={familyActionsMenu.hasMoreMenuActions}
        header={
          <FamilyPrimaryHeaderInfoV2
            family={family}
            primaryEmailAddress={primaryEmailAddress}
            primaryPhoneNumber={primaryPhoneNumber}
            primaryAddressText={primaryAddressText}
            onCopied={setAndShowGlobalSnackBar}
          />
        }
        isDesktop={isDesktop}
        menuAnchor={familyMoreMenuAnchor}
        onAddAdult={openAddAdultDialog}
        onAddChild={openAddChildDialog}
        onAddNote={openAddNoteDialog}
        onCloseMenu={() => setFamilyMoreMenuAnchor(null)}
        onCompleteOther={() => {
          setFamilyCompleteOtherOpen(true);
          setFamilyMoreMenuAnchor(null);
        }}
        onDeleteFamily={deleteFamilyDialogHandle.openDialog}
        onOpenMenu={(event) => setFamilyMoreMenuAnchor(event.currentTarget)}
        onPrintFamilyMemberInformation={printFamilyMemberInformation}
        onPrintNotes={() => reactToPrintFn()}
        onToggleTestFamily={() => void toggleTestFamilyFlag()}
        onUploadDocuments={openUploadDocumentDialog}
        printableFamilyMembers={printableFamilyMembers}
        roleRemovalActions={roleRemovalActions}
        roleResetActions={roleResetActions}
        showCompleteOtherAction={familyActionsMenu.showCompleteOtherAction}
        showDeleteFamilyAction={familyActionsMenu.showDeleteFamilyAction}
        showToggleTestFamilyAction={
          familyActionsMenu.showToggleTestFamilyAction
        }
        toggleTestFamilyLabel={familyActionsMenu.toggleTestFamilyLabel}
      />
      <FamilyScreenWorkflowCoordinatorV2
        addAdultDialogOpen={addAdultDialogOpen}
        addChildDialogOpen={addChildDialogOpen}
        addCommunityCandidateCommunities={addCommunityCandidateCommunities}
        addCommunityDrawerOpen={addCommunityDrawerOpen}
        addNoteDialogOpen={addNoteDialogOpen}
        closeCaseDrawerOpen={closeCaseDrawerOpen}
        deleteFamilyDialogHandle={deleteFamilyDialogHandle}
        family={family}
        familyCompleteOtherOpen={familyCompleteOtherOpen}
        familyId={familyId}
        openNewV1CaseDialogOpen={openNewV1CaseDialogOpen}
        openReferralId={openReferralId}
        recentFamilyNoteAction={recentFamilyNoteAction}
        recentReferralNoteAction={recentReferralNoteAction}
        removeRoleParameter={removeRoleParameter}
        resetRoleParameter={resetRoleParameter}
        selectedArrangementRow={selectedArrangementRow}
        selectedFamilyMemberRow={selectedFamilyMemberRow}
        selectedRemovedRole={selectedRemovedRole}
        selectedRoleSummaryCard={selectedRoleSummaryCard}
        selectedV1Case={selectedV1Case}
        uploadDocumentDialogOpen={false}
        onAddAdultClose={(_event: object | undefined, reason: string) =>
          !isBackdropClick(reason) ? setAddAdultDialogOpen(false) : {}
        }
        onAddChildClose={(_event: object | undefined, reason: string) =>
          !isBackdropClick(reason) ? setAddChildDialogOpen(false) : {}
        }
        onAddCommunityClose={() => setAddCommunityDrawerOpen(false)}
        onAddNoteClose={() => setAddNoteDialogOpen(false)}
        onArrangementClose={() => setSelectedArrangementRowId(null)}
        onCloseCaseDrawerClose={() => setCloseCaseDrawerOpen(false)}
        onFamilyCompleteOtherClose={() => setFamilyCompleteOtherOpen(false)}
        onFamilyMemberClose={() => setSelectedFamilyMemberRowId(null)}
        onOpenNewV1CaseDialogClose={() => setOpenNewV1CaseDialogOpen(false)}
        onRecentFamilyNoteActionClose={() => setRecentFamilyNoteAction(null)}
        onRecentReferralNoteActionClose={() =>
          setRecentReferralNoteAction(null)
        }
        onRemoveRoleClose={() => setRemoveRoleParameter(null)}
        onResetRoleClose={() => setResetRoleParameter(null)}
        onRoleDetailsClose={() => {
          setSelectedRoleSummaryCardId(null);
          setSelectedRemovedRoleId(null);
        }}
        onUploadDocumentClose={() => setUploadDocumentDialogOpen(false)}
      />
      <UploadFamilyDocumentsDrawerV2
        familyId={family.family!.id!}
        locationId={locationId}
        open={uploadDocumentDialogOpen}
        organizationId={organizationId}
        onClose={() => setUploadDocumentDialogOpen(false)}
      />
      <RoleSummaryCardsSection
        cards={roleSummaryCards}
        removedRoles={removedRoleSummaries}
        onCardClick={(card) => {
          setSelectedRemovedRoleId(null);
          setSelectedRoleSummaryCardId(card.id);
        }}
        onRemovedRoleClick={(removedRole) => {
          setSelectedRoleSummaryCardId(null);
          setSelectedRemovedRoleId(removedRole.id);
        }}
      />
      {isPartneringFamily && (
        <FamilyCaseWorkspaceHeaderV2
          activeCaseArrangements={activeCaseArrangements}
          canCloseV1Case={!!canCloseV1Case}
          canReopenSelectedV1Case={canReopenSelectedV1Case}
          currentReferral={currentReferral}
          family={family}
          referralsEnabled={referralsEnabled}
          selectedV1Case={selectedV1Case}
          onArrangementOpen={setSelectedArrangementRowId}
          onCloseCase={() => setCloseCaseDrawerOpen(true)}
          onOpenNewCase={() => setOpenNewV1CaseDialogOpen(true)}
          onReopenCase={() => void reopenCaseNow()}
        />
      )}

      <FamilyPinnedNotesV2
        notes={pinnedNotes}
        noteAuthorLookup={noteAuthorLookup}
      />
      <FamilyScreenTabsV2
        tabs={familyScreenTabs}
        selectedTab={selectedTab}
        isDesktop={isDesktop}
        onChange={setSelectedTab}
      />
      <Grid container spacing={0}>
        {showTimelineAndNotes && (
          <Grid item xs={12} spacing={0}>
            <ActivityTimelineV2
              family={family}
              referrals={familyReferrals}
              printContentRef={printContentRef}
            />
          </Grid>
        )}
        {!showTimelineAndNotes && showOverview && (
          <FamilyOverviewTabV2
            canAddCommunity={canAddCommunity}
            communityNameColor={theme.palette.primary.main}
            communityRows={overviewCommunityRows}
            completedRequirements={selectedV1Case?.completedRequirements ?? []}
            exemptedRequirements={selectedV1Case?.exemptedRequirements ?? []}
            familyCustomFields={overviewFamilyCustomFields}
            familyId={familyId}
            familyMemberRows={familyMemberRows}
            missingRequirements={selectedV1Case?.missingRequirements ?? []}
            noteAuthorLookup={noteAuthorLookup}
            recentOverviewTimelineItems={recentOverviewTimelineItems}
            renderRecentNoteActions={renderRecentNoteActions}
            showV1CaseRequirements={showV1CaseRequirements}
            userLookup={userLookup}
            v1CaseCustomFields={overviewV1CaseCustomFields}
            v1CaseId={selectedV1Case?.id}
            v1CaseRequirementContext={v1CaseRequirementContext}
            volunteerFamilyCustomFields={overviewVolunteerFamilyCustomFields}
            onAddCommunity={openAddCommunityDrawer}
            onCommunityClick={(communityId) =>
              appNavigate.organization(communityId)
            }
            onFamilyMemberClick={openFamilyMemberDrawer}
            onViewAllRecentActivity={() => setSelectedTab('timelineAndNotes')}
          />
        )}
        {!showTimelineAndNotes && !showOverview && (
          <Grid
            item
            xs={12}
            lg={12}
            sx={{ display: 'flex', flexDirection: 'column' }}
          >
            <Grid container spacing={2}>
              {showArrangementsOrAssignments && isVolunteerFamily && family && (
                <AssignmentsSection family={family} hideTitle />
              )}
            </Grid>

            <Grid container spacing={0} sx={{ order: 2 }}>
              {showCaseHistory && (
                <Grid item xs={12}>
                  <FamilyCaseHistoryTabV2
                    caseRows={caseReferralTable.caseRows}
                    referralsEnabled={referralsEnabled}
                    selectedV1CaseId={selectedV1Case?.id}
                    unlinkedReferrals={caseReferralTable.unlinkedReferrals}
                    onReferralOpen={(referralId) =>
                      appNavigate.referral(referralId)
                    }
                    onSelectCase={setSelectedV1CaseId}
                  />
                </Grid>
              )}

              {showApprovals && family.volunteerFamilyInfo && (
                <>
                  <Grid item xs={12}>
                    <ApprovalLedgerSection rows={approvalLedgerRows} />
                  </Grid>
                </>
              )}

              {showDocuments &&
                permissions(Permission.ViewFamilyDocumentMetadata) && (
                  <FamilyDocumentsSectionV2
                    family={family}
                    referrals={familyReferrals}
                    permissions={permissions}
                    organizationId={organizationId}
                    locationId={locationId}
                    uploaderLabel={familyDocumentUploaderLabel}
                    hideTitle
                  />
                )}
            </Grid>
            <Grid container spacing={0} sx={{ order: 1 }}>
              {showArrangementsOrAssignments &&
                !isVolunteerFamily &&
                selectedV1Case && (
                  <ArrangementsSection
                    arrangementRows={selectedCaseArrangementRows}
                    v1Case={selectedV1Case}
                    permissions={permissions}
                    hideTitle
                    onArrangementRowClick={openArrangementWorkspace}
                    scrollToArrangementId={arrangementIdToScrollTo}
                  />
                )}
            </Grid>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}
