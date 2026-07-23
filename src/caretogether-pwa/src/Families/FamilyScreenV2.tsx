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
  V1Case,
  V1Referral,
  RoleRemovalReason,
  Note,
  NoteStatus,
  V1ReferralNoteStatus,
} from '../GeneratedClient';
import { useParams } from 'react-router';
import {
  Check as CheckIcon,
  DeleteForever as DeleteForeverIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FamilyDocuments } from './FamilyDocuments';
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
  useCommunityLookup,
  useFamilyLookup,
  useNoteAuthorLookup,
  usePersonLookup,
  useUserLookup,
  useDirectoryModel,
} from '../Model/DirectoryModel';
import { isBackdropClick } from '../Utilities/handleBackdropClick';
import { useDialogHandle } from '../Hooks/useDialogHandle';
import { familyLastName } from './FamilyUtils';
import { useLoadable } from '../Hooks/useLoadable';
import { visibleCommunitiesQuery } from '../Model/Data';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import posthog from 'posthog-js';
import { AssignmentsSection } from '../Families/AssignmentsSectionV2';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useSyncV1CaseIdInURL } from '../Hooks/useSyncV1CaseIdInURL';
import { ArrangementsSection } from '../V1Cases/Arrangements/ArrangementsSection/ArrangementsSectionV2';
import { ArrangementRowV2 } from '../V1Cases/Arrangements/arrangementViewModel';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { TestFamilyBadge } from './TestFamilyBadge';
import { visibleReferralsQuery } from '../Model/Data';
import { useRecoilValue } from 'recoil';
import { useV1CasesModel } from '../Model/V1CasesModel';
import { policyData } from '../Model/ConfigurationModel';
import { FAMILY_MEMBER_PRINT_INFORMATION_FEATURE_FLAG } from '../featureFlags';
import { personNameString } from './PersonName';
import { useGlobalSnackBar } from '../Hooks/useGlobalSnackBar';
import { ApprovalLedgerSection } from './ApprovalLedgerSection';
import { RoleSummaryCardsSection } from './RoleSummaryCardsSection';
import { accountInfoState } from '../Authentication/Auth';
import { useLocation } from 'react-router-dom';
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
  FamilyScreenTabValue,
} from './FamilyScreenTabsV2';
import {
  FamilyPinnedNotesV2,
  RecentOverviewTimelineItem,
} from './FamilyRecentOverviewV2';
import { FamilyScreenWorkflowCoordinatorV2 } from './FamilyScreenWorkflowCoordinatorV2';
import { FamilyMemberRowV2 } from './familyMemberViewModel';
import { useFamilyApprovalViewModel } from './useFamilyApprovalViewModel';
import { useFamilyCaseViewModel } from './useFamilyCaseViewModel';
import { useFamilyOverviewViewModel } from './useFamilyOverviewViewModel';

type ReferralNoteEntry = NonNullable<V1Referral['notes']>[number];
type RecentNoteAction = 'edit' | 'approve' | 'delete';
function stringFromLocationState(state: unknown, key: string) {
  if (!state || typeof state !== 'object' || !(key in state)) {
    return undefined;
  }

  const value = (state as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : undefined;
}

export function FamilyScreenV2() {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const v1CaseIdFromQuery = searchParams.get('v1CaseId') ?? undefined;
  const v1CaseIdFromState = stringFromLocationState(location.state, 'v1CaseId');
  const v1CaseIdFromNavigation = v1CaseIdFromQuery ?? v1CaseIdFromState;
  const arrangementIdFromQuery = searchParams.get('arrangementId') ?? undefined;
  const arrangementIdFromState = stringFromLocationState(
    location.state,
    'arrangementId'
  );
  const arrangementIdFromNavigation =
    arrangementIdFromQuery ?? arrangementIdFromState;

  const communitiesLoadable = useLoadable(visibleCommunitiesQuery);
  const allCommunities = useMemo(
    () =>
      (communitiesLoadable || [])
        .map((x) => x.community!)
        .sort((a, b) => (a.name! < b.name! ? -1 : a.name! > b.name! ? 1 : 0)),
    [communitiesLoadable]
  );
  const communityLookup = useCommunityLookup();
  const allCommunityInfo = useMemo(
    () => allCommunities.map((c) => communityLookup(c.id)!),
    [allCommunities, communityLookup]
  );
  const familyCommunityInfo = useMemo(
    () =>
      allCommunityInfo?.filter((c) =>
        c.community?.memberFamilies?.includes(familyId)
      ),
    [allCommunityInfo, familyId]
  );

  const referralInfos = useRecoilValue(visibleReferralsQuery);

  const familyReferrals = useMemo(() => {
    return (referralInfos ?? [])
      .map((referralInfo) => referralInfo.referral)
      .filter((r) => r.familyId === familyId);
  }, [referralInfos, familyId]);

  const appNavigate = useAppNavigate();

  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();
  const noteAuthorLookup = useNoteAuthorLookup();
  const userLookup = useUserLookup();
  const family = familyLookup(familyId);
  const policy = useRecoilValue(policyData);
  const currentUserId = useLoadable(accountInfoState)?.userId;

  const directoryModel = useDirectoryModel();

  const withBackdrop = useBackdrop();
  const { setAndShowGlobalSnackBar } = useGlobalSnackBar();

  const permissions = useFamilyPermissions(family);
  const globalPermissions = useGlobalPermissions();

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
            (r2.closedAtUtc?.getTime() ?? 0) - (r1.closedAtUtc?.getTime() ?? 0)
        );
  }, [family?.partneringFamilyInfo?.closedV1Cases]);

  const allV1Cases: V1Case[] = useMemo(() => {
    return [...openV1Cases, ...closedV1Cases];
  }, [openV1Cases, closedV1Cases]);
  const [closeCaseDrawerOpen, setCloseCaseDrawerOpen] = useState(false);
  const v1CasesModel = useV1CasesModel();
  const [openNewV1CaseDialogOpen, setOpenNewV1CaseDialogOpen] = useState(false);
  const [uploadDocumentDialogOpen, setUploadDocumentDialogOpen] =
    useState(false);
  const [addAdultDialogOpen, setAddAdultDialogOpen] = useState(false);
  const [addChildDialogOpen, setAddChildDialogOpen] = useState(false);
  const [selectedFamilyMemberRow, setSelectedFamilyMemberRow] =
    useState<FamilyMemberRowV2 | null>(null);
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
  const [selectedTab, setSelectedTab] = useState<FamilyScreenTabValue>(
    arrangementIdFromNavigation ? 'arrangementsOrAssignments' : 'overview'
  );
  const [arrangementIdToScrollTo, setArrangementIdToScrollTo] = useState(
    arrangementIdFromNavigation
  );

  const firstV1CaseId = allV1Cases.length > 0 ? allV1Cases[0].id : undefined;

  const [selectedV1CaseId, setSelectedV1CaseId] = useState<string | undefined>(
    v1CaseIdFromNavigation || firstV1CaseId
  );
  const [selectedArrangementRowId, setSelectedArrangementRowId] = useState<
    string | null
  >(null);
  const {
    activeCaseArrangements,
    caseReferralTable,
    currentReferral,
    openReferralId,
    selectedArrangementRow,
    selectedCaseArrangementRows,
    selectedV1Case,
  } = useFamilyCaseViewModel({
    allV1Cases,
    family,
    familyLabel: (arrangementFamilyId) => {
      const matchedFamily = familyLookup(arrangementFamilyId);
      const primaryContactPerson = matchedFamily?.family?.adults?.find(
        (adult) =>
          adult.item1?.id === matchedFamily.family?.primaryFamilyContactPersonId
      )?.item1;

      return primaryContactPerson
        ? `${personNameString(primaryContactPerson)} Family`
        : 'Family';
    },
    familyReferrals,
    personLabel: (personFamilyId, personId) =>
      personNameString(personLookup(personFamilyId, personId)),
    policy,
    selectedArrangementRowId,
    selectedV1CaseId,
  });

  const hasOpenV1Case = openV1Cases.length > 0;
  const latestClosedV1Case = closedV1Cases[0];

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
  useEffect(() => {
    if (
      v1CaseIdFromNavigation &&
      allV1Cases.some((ref) => ref.id === v1CaseIdFromNavigation)
    ) {
      setSelectedV1CaseId(v1CaseIdFromNavigation);
    }
  }, [v1CaseIdFromNavigation, allV1Cases]);

  useEffect(() => {
    if (!arrangementIdFromNavigation) return;

    setSelectedTab('arrangementsOrAssignments');
    setArrangementIdToScrollTo(arrangementIdFromNavigation);
  }, [arrangementIdFromNavigation]);

  useEffect(() => {
    if (!arrangementIdFromNavigation || v1CaseIdFromNavigation) return;

    const v1CaseForArrangement = allV1Cases.find((v1Case) =>
      v1Case.arrangements?.some(
        (arrangement) => arrangement.id === arrangementIdFromNavigation
      )
    );

    if (v1CaseForArrangement?.id) {
      setSelectedV1CaseId(v1CaseForArrangement.id);
    }
  }, [arrangementIdFromNavigation, allV1Cases, v1CaseIdFromNavigation]);

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
    if (!arrangementIdFromQuery) return;

    appNavigate.family(familyId, v1CaseIdFromQuery, undefined, {
      replace: true,
    });
  }, [arrangementIdFromQuery, familyId, v1CaseIdFromQuery, appNavigate]);

  const [familyMoreMenuAnchor, setFamilyMoreMenuAnchor] =
    useState<Element | null>(null);

  const [familyCompleteOtherOpen, setFamilyCompleteOtherOpen] = useState(false);

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
    'updateTestFamilyFlag'
  );
  const referralsEnabled = useFeatureFlagEnabled('referrals');
  const familyMemberPrintInformationEnabled =
    useFeatureFlagEnabled(FAMILY_MEMBER_PRINT_INFORMATION_FEATURE_FLAG) ===
    true;
  const canViewFamilyCustomFields = permissions(
    Permission.ViewFamilyCustomFields
  );
  const canViewV1CaseCustomFields =
    permissions(Permission.ViewV1CaseCustomFields) && !referralsEnabled;

  useScreenTitle(family ? `${familyLastName(family)} Family` : '...');
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

  function openFamilyMemberDrawer(row: FamilyMemberRowV2) {
    setSelectedFamilyMemberRow(row);
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
  const primaryContactPerson = family?.family?.adults?.find(
    (adult) => adult.item1?.id === family.family?.primaryFamilyContactPersonId
  )?.item1;
  const primaryPhoneNumber =
    primaryContactPerson?.phoneNumbers?.find(
      (phoneNumber) =>
        phoneNumber.id === primaryContactPerson.preferredPhoneNumberId
    ) ?? primaryContactPerson?.phoneNumbers?.[0];
  const primaryEmailAddress =
    primaryContactPerson?.emailAddresses?.find(
      (emailAddress) =>
        emailAddress.id === primaryContactPerson.preferredEmailAddressId
    ) ?? primaryContactPerson?.emailAddresses?.[0];
  const primaryAddress = primaryContactPerson?.addresses?.find(
    (address) => address.id === primaryContactPerson.currentAddressId
  );
  const primaryAddressText = primaryAddress
    ? [
        primaryAddress.line1,
        primaryAddress.line2,
        [primaryAddress.city, primaryAddress.state, primaryAddress.postalCode]
          .filter(Boolean)
          .join(', '),
      ]
        .filter(Boolean)
        .join(' ')
    : undefined;
  const arrangementOrAssignmentsTabLabel = isVolunteerFamily
    ? 'Assignments'
    : 'Arrangements';
  const caseHistoryCount = allV1Cases.length;
  const arrangementsCount = selectedV1Case?.arrangements?.length ?? 0;
  const assignmentsCount =
    family?.volunteerFamilyInfo?.assignments?.length ?? 0;
  const documentsCount =
    (family?.uploadedDocuments?.length ?? 0) +
    familyReferrals.reduce(
      (count, referral) => count + (referral.uploadedDocuments?.length ?? 0),
      0
    );
  const familyNotesCount = family?.notes?.length ?? 0;
  const referralNotesCount = familyReferrals.reduce(
    (count, referral) => count + (referral.notes?.length ?? 0),
    0
  );
  const notesCount = familyNotesCount + referralNotesCount;
  const unapprovedNotesCount =
    (family?.notes?.filter((note) => note.status === NoteStatus.Draft).length ??
      0) +
    familyReferrals.reduce(
      (count, referral) =>
        count +
        (referral.notes?.filter(
          (note) => note.status === V1ReferralNoteStatus.Draft
        ).length ?? 0),
      0
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

  const familyScreenTabs: FamilyScreenTab[] = [
    {
      value: 'overview',
      label: 'Overview',
      desktopLabel: 'Overview',
      mobileLabel: 'Overview',
    },
    ...(isVolunteerFamily
      ? [
          {
            value: 'approvals' as const,
            label: 'Approvals',
            desktopLabel: approvalTabLabel('Approvals'),
            mobileLabel: approvalMobileTabLabel('Approvals'),
          },
        ]
      : []),
    {
      value: 'arrangementsOrAssignments',
      label: arrangementOrAssignmentsTabLabel,
      desktopLabel: tabLabel(
        arrangementOrAssignmentsTabLabel,
        isVolunteerFamily ? assignmentsCount : arrangementsCount
      ),
      mobileLabel: mobileTabLabel(
        arrangementOrAssignmentsTabLabel,
        isVolunteerFamily ? assignmentsCount : arrangementsCount
      ),
    },
    {
      value: 'documents',
      label: 'Documents',
      desktopLabel: tabLabel('Documents', documentsCount),
      mobileLabel: mobileTabLabel('Documents', documentsCount),
    },
    {
      value: 'timelineAndNotes',
      label: 'Timeline & Notes',
      desktopLabel: tabLabel(
        'Timeline & Notes',
        notesCount,
        unapprovedNotesCount
      ),
      mobileLabel: mobileTabLabel(
        'Timeline & Notes',
        notesCount,
        unapprovedNotesCount
      ),
    },
    ...(isPartneringFamily
      ? [
          {
            value: 'caseHistory' as const,
            label: 'Case History',
            desktopLabel: tabLabel('Case History', caseHistoryCount),
            mobileLabel: mobileTabLabel('Case History', caseHistoryCount),
          },
        ]
      : []),
  ];
  const showOverview = selectedTab === 'overview';
  const showCaseHistory = selectedTab === 'caseHistory' && isPartneringFamily;
  const showApprovals = selectedTab === 'approvals' && isVolunteerFamily;
  const showArrangementsOrAssignments =
    selectedTab === 'arrangementsOrAssignments';
  const showDocuments = selectedTab === 'documents';
  const showTimelineAndNotes = selectedTab === 'timelineAndNotes';

  useEffect(() => {
    if (selectedTab === 'approvals' && !isVolunteerFamily) {
      setSelectedTab('overview');
    }
    if (selectedTab === 'caseHistory' && !isPartneringFamily) {
      setSelectedTab('overview');
    }
  }, [isPartneringFamily, isVolunteerFamily, selectedTab]);

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

  const canUploadDocuments = permissions(Permission.UploadFamilyDocuments);
  const canEditFamilyInfo = permissions(Permission.EditFamilyInfo);
  const canAddNotes =
    permissions(Permission.AddEditDraftNotes) ||
    permissions(Permission.AddEditOwnDraftNotes);
  const canManageReferralNotes = globalPermissions(Permission.EditV1Referral);
  const showV1CaseRequirements =
    permissions(Permission.ViewV1CaseProgress) &&
    !referralsEnabled &&
    selectedV1Case !== undefined &&
    v1CaseRequirementContext !== undefined;

  function getRecentFamilyNotePermissions(note: Note) {
    const isOwnNote = note.authorUserId === currentUserId;

    return {
      canEdit:
        note.status === NoteStatus.Draft &&
        ((isOwnNote && permissions(Permission.AddEditOwnDraftNotes)) ||
          permissions(Permission.AddEditDraftNotes)),
      canDelete:
        note.status === NoteStatus.Draft &&
        ((isOwnNote && permissions(Permission.DiscardOwnDraftNotes)) ||
          permissions(Permission.DiscardDraftNotes)),
      canApprove:
        note.status === NoteStatus.Draft &&
        permissions(Permission.ApproveNotes),
    };
  }

  function renderRecentNoteActions(item: RecentOverviewTimelineItem) {
    if (item.note) {
      const { canDelete, canEdit, canApprove } = getRecentFamilyNotePermissions(
        item.note
      );

      if (!canDelete && !canEdit && !canApprove) return null;

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

    if (
      item.referralNote?.status !== V1ReferralNoteStatus.Draft ||
      !item.referralId ||
      !canManageReferralNotes
    ) {
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

  const hasVolunteerRoleActions =
    permissions(Permission.EditVolunteerRoleParticipation) &&
    (participatingFamilyRoles.length > 0 ||
      (family.volunteerFamilyInfo?.roleRemovals &&
        family.volunteerFamilyInfo.roleRemovals.length > 0));
  const hasPrintActions =
    familyMemberPrintInformationEnabled && printableFamilyMembers.length > 0;
  const hasMoreMenuActions =
    hasVolunteerRoleActions ||
    hasPrintActions ||
    canEditFamilyInfo ||
    (family.volunteerFamilyInfo != null &&
      permissions(Permission.EditApprovalRequirementCompletion));
  const hasFamilyActions =
    canUploadDocuments ||
    canEditFamilyInfo ||
    canAddNotes ||
    hasMoreMenuActions;
  const roleRemovalActions = permissions(
    Permission.EditVolunteerRoleParticipation
  )
    ? participatingFamilyRoles.map(([role]) => ({
        key: role,
        label: `Remove from ${role} role`,
        onClick: () => selectRemoveRole(role),
      }))
    : [];
  const roleResetActions = permissions(
    Permission.EditVolunteerRoleParticipation
  )
    ? (family.volunteerFamilyInfo?.roleRemovals || [])
        .filter((removedRole) => !removedRole.effectiveUntil)
        .map((removedRole) => ({
          key: removedRole.roleName!,
          label: `Reset ${removedRole.roleName} participation`,
          onClick: () =>
            selectResetRole(
              removedRole.roleName!,
              removedRole.reason!,
              removedRole.additionalComments!
            ),
        }))
    : [];

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
        canAddNotes={canAddNotes}
        canEditFamilyInfo={canEditFamilyInfo}
        canUploadDocuments={canUploadDocuments}
        familyMemberPrintInformationEnabled={
          familyMemberPrintInformationEnabled
        }
        hasFamilyActions={hasFamilyActions}
        hasMoreMenuActions={hasMoreMenuActions}
        header={
          <FamilyPrimaryHeaderInfoV2
            family={family}
            primaryEmailAddress={primaryEmailAddress?.address}
            primaryPhoneNumber={primaryPhoneNumber?.number}
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
        showCompleteOtherAction={
          family.volunteerFamilyInfo != null &&
          permissions(Permission.EditApprovalRequirementCompletion)
        }
        showDeleteFamilyAction={permissions(Permission.EditFamilyInfo)}
        showToggleTestFamilyAction={
          permissions(Permission.EditFamilyInfo) &&
          updateTestFamilyFlagEnabled === true
        }
        toggleTestFamilyLabel={
          family.family?.isTestFamily
            ? 'Unmark as test family'
            : 'Mark as test family'
        }
      />
      <FamilyScreenWorkflowCoordinatorV2
        addAdultDialogOpen={addAdultDialogOpen}
        addChildDialogOpen={addChildDialogOpen}
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
        uploadDocumentDialogOpen={uploadDocumentDialogOpen}
        onAddAdultClose={(_event: object | undefined, reason: string) =>
          !isBackdropClick(reason) ? setAddAdultDialogOpen(false) : {}
        }
        onAddChildClose={(_event: object | undefined, reason: string) =>
          !isBackdropClick(reason) ? setAddChildDialogOpen(false) : {}
        }
        onAddNoteClose={() => setAddNoteDialogOpen(false)}
        onArrangementClose={() => setSelectedArrangementRowId(null)}
        onCloseCaseDrawerClose={() => setCloseCaseDrawerOpen(false)}
        onFamilyCompleteOtherClose={() => setFamilyCompleteOtherOpen(false)}
        onFamilyMemberClose={() => setSelectedFamilyMemberRow(null)}
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
            canAddAdult={canEditFamilyInfo}
            canAddChild={canEditFamilyInfo}
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
            onAddAdult={openAddAdultDialog}
            onAddChild={openAddChildDialog}
            onCommunityClick={(communityId) =>
              appNavigate.community(communityId)
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
                  <Grid item xs={12} lg={8} xl={5} mb={2}>
                    <FamilyDocuments
                      family={family}
                      referrals={familyReferrals}
                    />
                  </Grid>
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
