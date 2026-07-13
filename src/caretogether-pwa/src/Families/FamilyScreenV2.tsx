import Grid from '../Generic/GridLegacyCompat';
import { useReactToPrint } from 'react-to-print';
import {
  Container,
  Toolbar,
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
  Typography,
  Tab,
  Tabs,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Stack,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
  CompletedCustomFieldInfo,
  Permission,
  V1Case,
  V1Referral,
  RoleRemovalReason,
  V1ReferralStatus,
  Activity,
  Note,
  NoteStatus,
  V1ReferralNoteStatus,
  ArrangementRequirementCompleted,
  ChildLocationChanged,
  ReferralOpened as V1CaseOpened,
  ReferralRequirementCompleted as V1CaseRequirementCompleted,
} from '../GeneratedClient';
import { useParams } from 'react-router';
import {
  AddCircle as AddCircleIcon,
  Check as CheckIcon,
  CloudUpload as CloudUploadIcon,
  ContentCopy as ContentCopyIcon,
  DeleteForever as DeleteForeverIcon,
  Diversity3 as Diversity3Icon,
  Edit as EditIcon,
  Notes as NotesIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  MoreVert as MoreVertIcon,
  PersonPinCircle as PersonPinCircleIcon,
  Phone as PhoneIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AddAdultDrawer } from './AddAdultDrawer';
import { AddChildDrawer } from './AddChildDrawer';
import { AddEditNoteDialog } from '../Notes/AddEditNoteDialog';
import { ApproveNoteDialog } from '../Notes/ApproveNoteDialog';
import { DiscardNoteDialog } from '../Notes/DiscardNoteDialog';
import { format } from 'date-fns';
import { UploadFamilyDocumentsDialog } from './UploadFamilyDocumentsDialog';
import { CloseV1CaseDrawer } from '../V1Cases/CloseV1CaseDrawer';
import { OpenNewV1CaseDialog } from '../V1Cases/OpenNewV1CaseDialog';
import { FamilyDocuments } from './FamilyDocuments';
import {
  useFamilyPermissions,
  useGlobalPermissions,
} from '../Model/SessionModel';
import { MissingRequirementRow } from '../Requirements/MissingRequirementRow';
import { ExemptedRequirementRow } from '../Requirements/ExemptedRequirementRow';
import { CompletedRequirementRow } from '../Requirements/CompletedRequirementRow';
import {
  IndividualVolunteerContext,
  V1CaseContext,
} from '../Requirements/RequirementContext';
import { ActivityTimelineV2 } from '../Activities/ActivityTimelineV2';
import { V1CaseCommentsV2 } from '../V1Cases/V1CaseCommentsV2';
import { V1CaseCustomField } from '../V1Cases/V1CaseCustomField';
import { PrimaryContactEditor } from './PrimaryContactEditor';
import {
  useScreenTitleComponent,
  useScreenTitle,
} from '../Shell/ShellScreenTitle';
import {
  useCommunityLookup,
  useFamilyLookup,
  useNoteAuthorLookup,
  useUserLookup,
  useDirectoryModel,
} from '../Model/DirectoryModel';
import { RemoveFamilyRoleDialog } from '../Volunteers/RemoveFamilyRoleDialog';
import { ResetFamilyRoleDialog } from '../Volunteers/ResetFamilyRoleDialog';
import { FamilyCustomField } from './FamilyCustomField';
import { VolunteerFamilyCustomField } from '../Volunteers/VolunteerFamilyCustomField';
import { isBackdropClick } from '../Utilities/handleBackdropClick';
import { DeleteFamilyDialog } from './DeleteFamilyDialog';
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
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { TestFamilyBadge } from './TestFamilyBadge';
import { visibleReferralsQuery } from '../Model/Data';
import { useRecoilValue } from 'recoil';
import { FamilyCompleteOtherController } from '../Requirements/FamilyCompleteOtherController';
import { useV1CasesModel } from '../Model/V1CasesModel';
import { formatStatusWithDate } from '../V1Referrals/formatStatusWithDate';
import { policyData } from '../Model/ConfigurationModel';
import { FAMILY_MEMBER_PRINT_INFORMATION_FEATURE_FLAG } from '../featureFlags';
import { PersonName } from './PersonName';
import { buildGroupedV1ReferralTimelineEntries } from '../V1Referrals/referralTimelineHelpers';
import { useGlobalSnackBar } from '../Hooks/useGlobalSnackBar';
import { ClampTypography } from '../Generic/ClampTypography';
import { ApprovalLedgerSection } from './ApprovalLedgerSection';
import { buildApprovalLedgerRows } from './approvalLedgerViewModel';
import {
  buildRemovedRoleSummaries,
  buildRoleSummaryCards,
} from './roleSummaryViewModel';
import { RoleSummaryCardsSection } from './RoleSummaryCardsSection';
import { RoleDetailsDrawerV2 } from './RoleDetailsDrawerV2';
import { accountInfoState } from '../Authentication/Auth';
import { AddEditV1ReferralNoteDialog } from '../V1Referrals/AddEditV1ReferralNoteDialog';
import { ApproveV1ReferralNoteDialog } from '../V1Referrals/ApproveV1ReferralNoteDialog';
import { DiscardV1ReferralNoteDialog } from '../V1Referrals/DiscardV1ReferralNoteDialog';
import { useLocation } from 'react-router-dom';
import { combineCustomFieldPolicies } from './familyMemberCustomFieldPolicies';
import {
  buildPrintableCustomFieldSections,
  personFullName,
  type PrintableFamilyMember,
} from './FamilyMemberPrintData';
import { FamilyMemberPrintDocument } from './FamilyMemberPrintDocument';
import { FamilyMembersDataGridV2 } from './FamilyMembersDataGridV2';
import { FamilyMemberDrawerV2 } from './FamilyMemberDrawerV2';
import {
  buildFamilyMemberRowsV2,
  FamilyMemberRowV2,
} from './familyMemberViewModel';
import { v2Typography } from './v2Typography';

type CustomFieldRenderInfo = CompletedCustomFieldInfo | string;
type ReferralNoteEntry = NonNullable<V1Referral['notes']>[number];
type RecentNoteAction = 'edit' | 'approve' | 'delete';
type RecentOverviewTimelineItem = {
  id: string;
  timestamp: Date;
  title: string;
  subtitle?: string;
  userId?: string;
  note?: Note;
  referralNote?: ReferralNoteEntry;
  referralId?: string;
  icon: 'check' | 'edit' | 'location';
};
type FamilyScreenTabValue =
  | 'overview'
  | 'caseHistory'
  | 'approvals'
  | 'arrangementsOrAssignments'
  | 'documents'
  | 'timelineAndNotes';
type FamilyScreenTab = {
  value: FamilyScreenTabValue;
  label: string;
  desktopLabel: React.ReactNode;
  mobileLabel: string;
};

function stringFromLocationState(state: unknown, key: string) {
  if (!state || typeof state !== 'object' || !(key in state)) {
    return undefined;
  }

  const value = (state as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : undefined;
}

function customFieldName(customField: CustomFieldRenderInfo) {
  return customField instanceof CompletedCustomFieldInfo
    ? customField.customFieldName!
    : customField;
}

function orderCustomFieldsByPolicy(
  customFields: CustomFieldRenderInfo[],
  policyFieldNames: string[]
) {
  const customFieldsByName = new Map(
    customFields.map((customField) => [
      customFieldName(customField),
      customField,
    ])
  );

  return policyFieldNames.flatMap((fieldName) => {
    const customField = customFieldsByName.get(fieldName);
    return customField === undefined ? [] : [customField];
  });
}

function getDateValue(value?: Date | string | null): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  return new Date(value).getTime();
}

function getNoteTimestamp(note: Note | ReferralNoteEntry) {
  return (
    note.backdatedTimestampUtc ??
    note.createdTimestampUtc ??
    note.lastEditTimestampUtc
  );
}

function recentActivityTitle(activity: Activity) {
  if (
    activity instanceof V1CaseRequirementCompleted ||
    activity instanceof ArrangementRequirementCompleted
  ) {
    return activity.requirementName || 'Requirement completed';
  }

  if (activity instanceof ChildLocationChanged) {
    return 'Child location changed';
  }

  if (activity instanceof V1CaseOpened) {
    return 'Case opened';
  }

  if (activity.uploadedDocumentId) {
    return 'Document uploaded';
  }

  return 'Family activity';
}

function recentActivityIcon(
  activity: Activity
): RecentOverviewTimelineItem['icon'] {
  if (
    activity instanceof V1CaseRequirementCompleted ||
    activity instanceof ArrangementRequirementCompleted
  ) {
    return 'check';
  }

  if (activity instanceof ChildLocationChanged) {
    return 'location';
  }

  return 'edit';
}

type ContactInfoCopyButtonProps = {
  value: string;
  label: string;
  onCopied: (message: string) => void;
};

function ContactInfoCopyButton({
  value,
  label,
  onCopied,
}: ContactInfoCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopied(`${label} copied`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      onCopied(`Unable to copy ${label.toLowerCase()}`);
    }
  }

  return (
    <Tooltip title={copied ? 'Copied' : `Copy ${label.toLowerCase()}`}>
      <IconButton
        size="small"
        aria-label={`copy ${label.toLowerCase()}`}
        onClick={() => void handleCopy()}
        sx={{ p: 0.25 }}
      >
        {copied ? (
          <CheckIcon color="success" fontSize="small" />
        ) : (
          <ContentCopyIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
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
  const openReferralId = useMemo(
    () =>
      familyReferrals.find((r) => r.status === V1ReferralStatus.Open)
        ?.referralId,
    [familyReferrals]
  );
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
  const selectedV1Case = useMemo(
    () => allV1Cases.find((v1Case) => v1Case.id === selectedV1CaseId),
    [allV1Cases, selectedV1CaseId]
  );

  const hasOpenV1Case = openV1Cases.length > 0;
  const latestClosedV1Case = closedV1Cases[0];

  const canReopenSelectedV1Case =
    !!selectedV1Case?.closedAtUtc &&
    !hasOpenV1Case &&
    selectedV1Case.id === latestClosedV1Case?.id &&
    permissions(Permission.CloseV1Case);

  const caseReferralTable = useMemo(() => {
    const linkedReferralIds = new Set(
      allV1Cases.flatMap((c) => c.linkedV1ReferralIds ?? [])
    );

    const unlinkedReferrals = familyReferrals.filter(
      (r) => !linkedReferralIds.has(r.referralId)
    );

    const caseRows = allV1Cases.map((v1Case) => {
      const caseLinkedReferralIds = new Set(v1Case.linkedV1ReferralIds ?? []);
      const linkedReferrals = familyReferrals.filter((r) =>
        caseLinkedReferralIds.has(r.referralId)
      );

      return { v1Case, linkedReferrals };
    });

    return { caseRows, unlinkedReferrals };
  }, [allV1Cases, familyReferrals]);

  const currentReferral = useMemo(() => {
    const selectedCaseRow = caseReferralTable.caseRows.find(
      ({ v1Case }) => v1Case.id === selectedV1Case?.id
    );

    return (
      selectedCaseRow?.linkedReferrals[0] ??
      familyReferrals.find(
        (referral) => referral.status === V1ReferralStatus.Open
      )
    );
  }, [caseReferralTable.caseRows, familyReferrals, selectedV1Case?.id]);

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

  function openArrangementFromFamilyMember(
    arrangementId: string,
    v1CaseId: string
  ) {
    setSelectedV1CaseId(v1CaseId);
    setSelectedTab('arrangementsOrAssignments');
    setArrangementIdToScrollTo(arrangementId);
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
  const activeAdults = useMemo<PrintableFamilyMember[]>(() => {
    return (family?.family?.adults ?? []).flatMap((adult) =>
      adult.item1?.id && adult.item1.active && adult.item2
        ? [
            {
              kind: 'adult' as const,
              person: adult.item1,
              relationshipToFamily: adult.item2,
            },
          ]
        : []
    );
  }, [family?.family?.adults]);
  const activeChildren = useMemo<PrintableFamilyMember[]>(() => {
    return (family?.family?.children ?? []).flatMap((child) =>
      child.id && child.active
        ? [
            {
              kind: 'child' as const,
              person: child,
            },
          ]
        : []
    );
  }, [family?.family?.children]);
  const familyMemberRows = useMemo(
    () =>
      family
        ? buildFamilyMemberRowsV2({
            family,
            permissions,
            v1Cases: allV1Cases,
          })
        : [],
    [allV1Cases, family, permissions]
  );
  const printableFamilyMembers = useMemo(
    () => activeAdults.concat(activeChildren),
    [activeAdults, activeChildren]
  );
  const adultCustomFieldPolicies = useMemo(
    () =>
      combineCustomFieldPolicies(
        family?.partneringFamilyInfo != null
          ? (policy.customFields?.partneringFamily?.adult ?? [])
          : [],
        family?.volunteerFamilyInfo != null
          ? (policy.customFields?.volunteerFamily?.adult ?? [])
          : []
      ),
    [
      family?.partneringFamilyInfo,
      family?.volunteerFamilyInfo,
      policy.customFields?.partneringFamily?.adult,
      policy.customFields?.volunteerFamily?.adult,
    ]
  );
  const childCustomFieldPolicies = useMemo(
    () =>
      combineCustomFieldPolicies(
        family?.partneringFamilyInfo != null
          ? (policy.customFields?.partneringFamily?.child ?? [])
          : [],
        family?.volunteerFamilyInfo != null
          ? (policy.customFields?.volunteerFamily?.child ?? [])
          : []
      ),
    [
      family?.partneringFamilyInfo,
      family?.volunteerFamilyInfo,
      policy.customFields?.partneringFamily?.child,
      policy.customFields?.volunteerFamily?.child,
    ]
  );
  const familyMemberPrintCustomFieldSections = useMemo(() => {
    if (!familyMemberToPrint) return [];
    if (!permissions(Permission.ViewFamilyCustomFields)) return [];

    return buildPrintableCustomFieldSections(
      familyMemberToPrint.person.completedCustomFields,
      familyMemberToPrint.kind === 'adult'
        ? adultCustomFieldPolicies
        : childCustomFieldPolicies
    );
  }, [
    adultCustomFieldPolicies,
    childCustomFieldPolicies,
    familyMemberToPrint,
    permissions,
  ]);
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
  const volunteerFamilyInfo = family?.volunteerFamilyInfo;
  const activeAdultApprovalSources = useMemo(() => {
    const activeAdultIds = new Set(
      (family?.family?.adults ?? []).flatMap((adult) =>
        adult.item1?.id && adult.item1.active ? [adult.item1.id] : []
      )
    );
    const adultApprovalSources = Object.entries(
      volunteerFamilyInfo?.individualVolunteers ?? {}
    )
      .filter(([personId]) => activeAdultIds.has(personId))
      .map(([personId, volunteerInfo]) => {
        const adult = family?.family?.adults?.find(
          (familyAdult) => familyAdult.item1?.id === personId
        );
        const person = adult?.item1;

        const label =
          [person?.firstName, person?.lastName].filter(Boolean).join(' ') ||
          'Adult';
        const context: IndividualVolunteerContext = {
          kind: 'Individual Volunteer',
          volunteerFamilyId: familyId,
          personId,
        };

        return {
          id: personId,
          label,
          context,
          subject: {
            scope: 'person' as const,
            id: personId,
            label,
          },
          approvalStatusByRole: volunteerInfo.approvalStatusByRole ?? {},
          roleRemovals: volunteerInfo.roleRemovals ?? [],
          completedRequirements: volunteerInfo.completedRequirements ?? [],
          exemptedRequirements: volunteerInfo.exemptedRequirements ?? [],
          missingRequirements: volunteerInfo.missingRequirements ?? [],
          availableApplications: volunteerInfo.availableApplications ?? [],
        };
      });

    return adultApprovalSources;
  }, [
    family?.family?.adults,
    familyId,
    volunteerFamilyInfo?.individualVolunteers,
  ]);

  const approvalLedgerRows = useMemo(() => {
    return buildApprovalLedgerRows({
      family: {
        context: {
          kind: 'Volunteer Family',
          volunteerFamilyId: familyId,
        },
        completedRequirements: volunteerFamilyInfo?.completedRequirements ?? [],
        exemptedRequirements: volunteerFamilyInfo?.exemptedRequirements ?? [],
        missingRequirements: volunteerFamilyInfo?.missingRequirements ?? [],
        availableApplications: volunteerFamilyInfo?.availableApplications ?? [],
        familyRoleApprovals: volunteerFamilyInfo?.familyRoleApprovals ?? {},
        roleRemovals: volunteerFamilyInfo?.roleRemovals ?? [],
      },
      individuals: activeAdultApprovalSources,
    });
  }, [
    activeAdultApprovalSources,
    familyId,
    volunteerFamilyInfo?.availableApplications,
    volunteerFamilyInfo?.completedRequirements,
    volunteerFamilyInfo?.exemptedRequirements,
    volunteerFamilyInfo?.familyRoleApprovals,
    volunteerFamilyInfo?.missingRequirements,
    volunteerFamilyInfo?.roleRemovals,
  ]);
  const roleSummaryCards = useMemo(
    () =>
      buildRoleSummaryCards({
        family: {
          context: {
            kind: 'Volunteer Family',
            volunteerFamilyId: familyId,
          },
          completedRequirements:
            volunteerFamilyInfo?.completedRequirements ?? [],
          exemptedRequirements: volunteerFamilyInfo?.exemptedRequirements ?? [],
          missingRequirements: volunteerFamilyInfo?.missingRequirements ?? [],
          availableApplications:
            volunteerFamilyInfo?.availableApplications ?? [],
          familyRoleApprovals: volunteerFamilyInfo?.familyRoleApprovals ?? {},
          roleRemovals: volunteerFamilyInfo?.roleRemovals ?? [],
        },
        individuals: activeAdultApprovalSources,
        approvalLedgerRows,
      }),
    [
      activeAdultApprovalSources,
      approvalLedgerRows,
      familyId,
      volunteerFamilyInfo?.availableApplications,
      volunteerFamilyInfo?.completedRequirements,
      volunteerFamilyInfo?.exemptedRequirements,
      volunteerFamilyInfo?.familyRoleApprovals,
      volunteerFamilyInfo?.missingRequirements,
      volunteerFamilyInfo?.roleRemovals,
    ]
  );
  const selectedRoleSummaryCard = useMemo(
    () =>
      roleSummaryCards.find((card) => card.id === selectedRoleSummaryCardId) ??
      null,
    [roleSummaryCards, selectedRoleSummaryCardId]
  );
  const removedRoleSummaries = useMemo(
    () =>
      buildRemovedRoleSummaries({
        family: {
          context: {
            kind: 'Volunteer Family',
            volunteerFamilyId: familyId,
          },
          roleRemovals: volunteerFamilyInfo?.roleRemovals ?? [],
        },
        individuals: activeAdultApprovalSources,
      }),
    [activeAdultApprovalSources, familyId, volunteerFamilyInfo?.roleRemovals]
  );
  const selectedRemovedRole = useMemo(
    () =>
      removedRoleSummaries.find(
        (removedRole) => removedRole.id === selectedRemovedRoleId
      ) ?? null,
    [removedRoleSummaries, selectedRemovedRoleId]
  );
  const approvalAttentionCounts = useMemo(
    () =>
      approvalLedgerRows.reduce(
        (counts, row) => {
          if (row.status === 'missing') {
            return { ...counts, missing: counts.missing + 1 };
          }

          if (row.status === 'expired') {
            return { ...counts, expired: counts.expired + 1 };
          }

          return counts;
        },
        { missing: 0, expired: 0 }
      ),
    [approvalLedgerRows]
  );

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

  function tabLabel(label: string, count?: number, unapprovedCount?: number) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <span>{label}</span>
        {count !== undefined && (
          <Chip
            size="small"
            variant="outlined"
            label={count}
            sx={{ height: 20, '& .MuiChip-label': { px: 0.75 } }}
          />
        )}
        {unapprovedCount !== undefined && unapprovedCount > 0 && (
          <Chip
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
        <Box component="span" sx={{ flexShrink: 0 }}>
          {label}
        </Box>
        {approvalAttentionCounts.missing > 0 && (
          <Tooltip title={`${approvalAttentionCounts.missing} missing`}>
            <Chip
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

  function handleSelectedTabChange(
    event: SelectChangeEvent<FamilyScreenTabValue>
  ) {
    setSelectedTab(event.target.value as FamilyScreenTabValue);
  }
  const pinnedNotes = useMemo(() => {
    return (family?.notes ?? [])
      .filter((note) => note.isPinned)
      .sort(
        (a, b) =>
          getDateValue(b.pinnedAtUtc ?? getNoteTimestamp(b)) -
          getDateValue(a.pinnedAtUtc ?? getNoteTimestamp(a))
      );
  }, [family?.notes]);
  const recentOverviewTimelineItems = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const familyActivityRecords = [
      ...(family?.partneringFamilyInfo?.history ?? []),
      ...(family?.volunteerFamilyInfo?.history ?? []),
    ];
    const familyNotesById = new Map(
      (family?.notes ?? []).map((note) => [note.id, note])
    );
    const linkedFamilyNoteIds = new Set(
      familyActivityRecords.flatMap((activity) =>
        activity.noteId ? [activity.noteId] : []
      )
    );

    const familyActivities: RecentOverviewTimelineItem[] =
      familyActivityRecords.map((activity) => {
        const linkedNote = activity.noteId
          ? familyNotesById.get(activity.noteId)
          : undefined;

        return {
          id: `activity:${activity.auditTimestampUtc?.toISOString()}`,
          timestamp: activity.activityTimestampUtc,
          title: recentActivityTitle(activity),
          subtitle: linkedNote?.contents?.trim(),
          userId: activity.userId,
          note: linkedNote,
          icon: recentActivityIcon(activity),
        };
      });

    const familyNotes: RecentOverviewTimelineItem[] =
      family?.notes
        ?.filter((note) => !linkedFamilyNoteIds.has(note.id))
        .map((note) => ({
          id: `note:${note.id}`,
          timestamp: getNoteTimestamp(note),
          title: 'Family note',
          subtitle: note.contents?.trim(),
          userId: note.authorUserId,
          note,
          icon: 'edit',
        })) ?? [];

    const referralActivities: RecentOverviewTimelineItem[] =
      familyReferrals.flatMap((referral) =>
        buildGroupedV1ReferralTimelineEntries(referral).map((entry) => ({
          id: `referral-${entry.kind}:${referral.referralId}:${entry.timestamp.toISOString()}`,
          timestamp: entry.timestamp,
          title: entry.label,
          subtitle:
            entry.kind === 'note'
              ? entry.note.contents?.trim()
              : `Referral: ${referral.title}`,
          userId: entry.userId,
          referralNote: entry.kind === 'note' ? entry.note : undefined,
          referralId: referral.referralId,
          icon: 'edit',
        }))
      );

    return [...familyActivities, ...familyNotes, ...referralActivities]
      .filter((item) => {
        const timestamp = getDateValue(item.timestamp);
        return (
          timestamp >= sevenDaysAgo.getTime() && timestamp <= now.getTime()
        );
      })
      .sort((a, b) => getDateValue(b.timestamp) - getDateValue(a.timestamp))
      .slice(0, 6);
  }, [
    family?.notes,
    family?.partneringFamilyInfo?.history,
    family?.volunteerFamilyInfo?.history,
    familyReferrals,
  ]);

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
      <Toolbar
        variant="dense"
        disableGutters={true}
        sx={{
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          py: 1,
        }}
      >
        <Box sx={{ flex: '1 1 320px', minWidth: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 1,
              mb: 0.5,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1,
                minWidth: 0,
              }}
            >
              <Typography className="ph-unmask" variant="h4">
                {familyLastName(family)} Family
              </Typography>
            </Box>
            {!isDesktop && hasFamilyActions && (
              <IconButton
                className="ph-unmask"
                aria-label="family actions"
                onClick={(event) =>
                  setFamilyMoreMenuAnchor(event.currentTarget)
                }
                size="small"
                sx={{
                  border: 1,
                  borderColor: 'primary.main',
                  borderRadius: 1,
                  color: 'primary.main',
                  flex: '0 0 auto',
                  width: 36,
                  height: 36,
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              columnGap: 2,
              rowGap: 0.5,
            }}
          >
            <Box className="ph-unmask">
              <PrimaryContactEditor family={family} />
            </Box>
            {primaryEmailAddress?.address && (
              <Box
                className="ph-unmask"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                <EmailIcon fontSize="small" color="action" />
                <Typography {...v2Typography.browserCell}>
                  {primaryEmailAddress.address}
                </Typography>
                <ContactInfoCopyButton
                  value={primaryEmailAddress.address}
                  label="Email"
                  onCopied={setAndShowGlobalSnackBar}
                />
              </Box>
            )}
            {primaryPhoneNumber?.number && (
              <Box
                className="ph-unmask"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                <PhoneIcon fontSize="small" color="action" />
                <Typography {...v2Typography.browserCell}>
                  {primaryPhoneNumber.number}
                </Typography>
                <ContactInfoCopyButton
                  value={primaryPhoneNumber.number}
                  label="Phone number"
                  onCopied={setAndShowGlobalSnackBar}
                />
              </Box>
            )}
            {primaryAddressText && (
              <Box
                className="ph-unmask"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                <HomeIcon fontSize="small" color="action" />
                <Typography {...v2Typography.browserCell}>
                  {primaryAddressText}
                </Typography>
                <ContactInfoCopyButton
                  value={primaryAddressText}
                  label="Address"
                  onCopied={setAndShowGlobalSnackBar}
                />
              </Box>
            )}
          </Box>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flex: '0 1 auto',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            gap: 1,
          }}
        >
          {isDesktop && canUploadDocuments && (
            <Button
              className="ph-unmask"
              onClick={() => setUploadDocumentDialogOpen(true)}
              variant="contained"
              size="small"
              startIcon={<CloudUploadIcon />}
            >
              Upload
            </Button>
          )}
          {isDesktop && canEditFamilyInfo && (
            <Button
              className="ph-unmask"
              onClick={() => setAddAdultDialogOpen(true)}
              variant="contained"
              size="small"
              startIcon={<AddCircleIcon />}
            >
              Adult
            </Button>
          )}
          {isDesktop && canEditFamilyInfo && (
            <Button
              className="ph-unmask"
              onClick={() => setAddChildDialogOpen(true)}
              variant="contained"
              size="small"
              startIcon={<AddCircleIcon />}
            >
              Child
            </Button>
          )}
          {isDesktop && canAddNotes && (
            <Button
              className="ph-unmask"
              onClick={() => setAddNoteDialogOpen(true)}
              variant="contained"
              size="small"
              startIcon={<AddCircleIcon />}
            >
              Note
            </Button>
          )}
          {isDesktop && hasMoreMenuActions && (
            <IconButton
              onClick={(event) => setFamilyMoreMenuAnchor(event.currentTarget)}
              size="small"
            >
              <MoreVertIcon />
            </IconButton>
          )}
        </Box>
        <Menu
          id="family-more-menu"
          anchorEl={familyMoreMenuAnchor}
          keepMounted
          open={Boolean(familyMoreMenuAnchor)}
          onClose={() => setFamilyMoreMenuAnchor(null)}
        >
          <MenuList dense={isDesktop}>
            {!isDesktop && canUploadDocuments && (
              <MenuItem onClick={openUploadDocumentDialog}>
                <ListItemIcon>
                  <CloudUploadIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText className="ph-unmask" primary="Upload" />
              </MenuItem>
            )}
            {!isDesktop && canEditFamilyInfo && (
              <MenuItem onClick={openAddAdultDialog}>
                <ListItemIcon>
                  <AddCircleIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText className="ph-unmask" primary="Adult" />
              </MenuItem>
            )}
            {!isDesktop && canEditFamilyInfo && (
              <MenuItem onClick={openAddChildDialog}>
                <ListItemIcon>
                  <AddCircleIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText className="ph-unmask" primary="Child" />
              </MenuItem>
            )}
            {!isDesktop && canAddNotes && (
              <MenuItem onClick={openAddNoteDialog}>
                <ListItemIcon>
                  <AddCircleIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText className="ph-unmask" primary="Note" />
              </MenuItem>
            )}
            {!isDesktop &&
              (canUploadDocuments || canEditFamilyInfo || canAddNotes) &&
              hasMoreMenuActions && <Divider />}
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

            {familyMemberPrintInformationEnabled &&
              printableFamilyMembers.map((member) => (
                <MenuItem
                  key={`${member.kind}:${member.person.id}`}
                  onClick={() => printFamilyMemberInformation(member)}
                >
                  <ListItemIcon>
                    <PrintIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    className="ph-unmask"
                    primary={`Print ${personFullName(member.person)} information`}
                  />
                </MenuItem>
              ))}

            {family.volunteerFamilyInfo != null &&
              permissions(Permission.EditApprovalRequirementCompletion) && (
                <MenuItem
                  onClick={() => {
                    setFamilyCompleteOtherOpen(true);
                    setFamilyMoreMenuAnchor(null);
                  }}
                >
                  <ListItemText primary="Complete other..." />
                </MenuItem>
              )}

            {permissions(Permission.EditFamilyInfo) &&
              updateTestFamilyFlagEnabled && (
                <MenuItem
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    setFamilyMoreMenuAnchor(null);

                    const isCurrentlyTest =
                      family.family?.isTestFamily ?? false;
                    await withBackdrop(async () => {
                      await directoryModel.updateTestFamilyFlag(
                        family.family.id,
                        !isCurrentlyTest
                      );
                    });
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
        <FamilyCompleteOtherController
          familyId={familyId}
          open={familyCompleteOtherOpen}
          onClose={() => setFamilyCompleteOtherOpen(false)}
        />
        {uploadDocumentDialogOpen && (
          <UploadFamilyDocumentsDialog
            family={family}
            onClose={() => setUploadDocumentDialogOpen(false)}
          />
        )}
        {addAdultDialogOpen && (
          <AddAdultDrawer
            onClose={(_event: object | undefined, reason: string) =>
              !isBackdropClick(reason) ? setAddAdultDialogOpen(false) : {}
            }
          />
        )}
        {addChildDialogOpen && (
          <AddChildDrawer
            onClose={(_event: object | undefined, reason: string) =>
              !isBackdropClick(reason) ? setAddChildDialogOpen(false) : {}
            }
          />
        )}
        <FamilyMemberDrawerV2
          family={family}
          row={selectedFamilyMemberRow}
          open={selectedFamilyMemberRow !== null}
          onClose={() => setSelectedFamilyMemberRow(null)}
        />
        {addNoteDialogOpen && (
          <AddEditNoteDialog
            familyId={family.family!.id!}
            onClose={() => setAddNoteDialogOpen(false)}
          />
        )}
        {recentFamilyNoteAction?.action === 'edit' && (
          <AddEditNoteDialog
            familyId={family.family!.id!}
            note={recentFamilyNoteAction.note}
            onClose={() => setRecentFamilyNoteAction(null)}
          />
        )}
        {recentFamilyNoteAction?.action === 'approve' && (
          <ApproveNoteDialog
            familyId={family.family!.id!}
            note={recentFamilyNoteAction.note}
            onClose={() => setRecentFamilyNoteAction(null)}
          />
        )}
        {recentFamilyNoteAction?.action === 'delete' && (
          <DiscardNoteDialog
            familyId={family.family!.id!}
            note={recentFamilyNoteAction.note}
            onClose={() => setRecentFamilyNoteAction(null)}
          />
        )}
        {recentReferralNoteAction?.action === 'edit' && (
          <AddEditV1ReferralNoteDialog
            referralId={recentReferralNoteAction.referralId}
            note={recentReferralNoteAction.note}
            onClose={() => setRecentReferralNoteAction(null)}
          />
        )}
        {recentReferralNoteAction?.action === 'approve' && (
          <ApproveV1ReferralNoteDialog
            referralId={recentReferralNoteAction.referralId}
            note={recentReferralNoteAction.note}
            onClose={() => setRecentReferralNoteAction(null)}
          />
        )}
        {recentReferralNoteAction?.action === 'delete' && (
          <DiscardV1ReferralNoteDialog
            referralId={recentReferralNoteAction.referralId}
            note={recentReferralNoteAction.note}
            onClose={() => setRecentReferralNoteAction(null)}
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
      </Toolbar>
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
      <RoleDetailsDrawerV2
        card={selectedRoleSummaryCard}
        removedRole={selectedRemovedRole}
        open={selectedRoleSummaryCard !== null || selectedRemovedRole !== null}
        onClose={() => {
          setSelectedRoleSummaryCardId(null);
          setSelectedRemovedRoleId(null);
        }}
      />
      {isPartneringFamily && (
        <Box
          sx={{
            borderLeft: 4,
            borderColor: selectedV1Case?.closedAtUtc
              ? 'divider'
              : 'primary.main',
            borderRadius: 1,
            bgcolor: 'background.paper',
            boxShadow: 1,
            px: { xs: 1.5, sm: 2 },
            py: 1.5,
            mb: 1.5,
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gap: { xs: 1.25, md: 2 },
              gridTemplateColumns: { xs: '1fr', md: 'minmax(280px, 2fr) 3fr' },
              alignItems: 'start',
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              {selectedV1Case ? (
                <Stack spacing={1}>
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        fontWeight: 700,
                        letterSpacing: 0.4,
                        textTransform: 'uppercase',
                      }}
                    >
                      Current Case
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 1.5,
                        flexWrap: 'wrap',
                        mb: 0.5,
                      }}
                    >
                      <Box
                        sx={{
                          alignItems: 'center',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 1,
                          minWidth: 0,
                        }}
                      >
                        <Typography
                          className="ph-unmask"
                          color="text.secondary"
                          variant="subtitle1"
                          sx={{ fontWeight: 600, m: 0 }}
                        >
                          {selectedV1Case.closedAtUtc
                            ? 'Closed Case'
                            : 'Open Case'}
                        </Typography>
                        <Chip
                          size="small"
                          color={
                            selectedV1Case.closedAtUtc ? 'default' : 'success'
                          }
                          label={
                            selectedV1Case.closedAtUtc ? 'Closed' : 'Open'
                          }
                        />
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {!selectedV1Case.closedAtUtc && canCloseV1Case && (
                          <Button
                            className="ph-unmask"
                            onClick={() => setCloseCaseDrawerOpen(true)}
                            variant="contained"
                            size="small"
                          >
                            Close Case
                          </Button>
                        )}
                        {selectedV1Case.closedAtUtc &&
                          canReopenSelectedV1Case && (
                            <Button
                              className="ph-unmask"
                              onClick={() => void reopenCaseNow()}
                              variant="contained"
                              size="small"
                            >
                              Reopen Case
                            </Button>
                          )}
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Typography
                        className="ph-unmask"
                        variant="body2"
                        color="text.secondary"
                      >
                        Opened {format(selectedV1Case.openedAtUtc, 'M/d/yy')}
                      </Typography>
                      {selectedV1Case.closedAtUtc && (
                        <Typography
                          className="ph-unmask"
                          variant="body2"
                          color="text.secondary"
                        >
                          Closed {format(selectedV1Case.closedAtUtc, 'M/d/yy')}
                        </Typography>
                      )}
                      {selectedV1Case.closeReason && (
                        <Typography
                          className="ph-unmask"
                          variant="body2"
                          color="text.secondary"
                        >
                          {selectedV1Case.closeReason}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  {currentReferral && (
                    <Box
                      sx={{
                        borderLeft: 2,
                        borderColor: 'divider',
                        ml: { xs: 0, sm: 0.5 },
                        pl: 1.5,
                        py: 0.25,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: 'block',
                          fontWeight: 600,
                          letterSpacing: 0.3,
                          mb: 0.25,
                          textTransform: 'uppercase',
                        }}
                      >
                        Linked Referral
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.25,
                          flexWrap: 'wrap',
                        }}
                      >
                        <Typography
                          className="ph-unmask"
                          {...v2Typography.primaryValue}
                        >
                          {currentReferral.title}
                        </Typography>
                        <Chip
                          className="ph-unmask"
                          size="small"
                          label={
                            currentReferral.acceptedAtUtc
                              ? `Accepted \u2022 ${format(
                                  currentReferral.acceptedAtUtc,
                                  'MMM d, yyyy'
                                )}`
                              : formatStatusWithDate(
                                  currentReferral.status,
                                  currentReferral.createdAtUtc,
                                  currentReferral.acceptedAtUtc,
                                  currentReferral.closedAtUtc
                                )
                          }
                        />
                        <Chip
                          className="ph-unmask"
                          size="small"
                          variant="outlined"
                          label={`Received \u2022 ${format(
                            currentReferral.createdAtUtc,
                            'MMM d, yyyy'
                          )}`}
                        />
                        <Button
                          className="ph-unmask"
                          onClick={() =>
                            appNavigate.referral(currentReferral.referralId)
                          }
                          variant="text"
                          size="small"
                        >
                          View Referral
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Stack>
              ) : (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: 'block',
                      fontWeight: 700,
                      letterSpacing: 0.4,
                      mb: 0.25,
                      textTransform: 'uppercase',
                    }}
                  >
                    Current Case
                  </Typography>
                  <Typography className="ph-unmask" variant="h3">
                    No current case
                  </Typography>
                  {!referralsEnabled &&
                    permissions(Permission.CreateV1Case) && (
                      <Button
                        className="ph-unmask"
                        onClick={() => setOpenNewV1CaseDialogOpen(true)}
                        variant="contained"
                        size="small"
                        sx={{ mt: 1 }}
                      >
                        Open New Case
                      </Button>
                    )}
                </Box>
              )}
              {closeCaseDrawerOpen && selectedV1Case?.id && (
                <CloseV1CaseDrawer
                  partneringFamilyId={familyId}
                  v1CaseId={selectedV1Case.id}
                  onClose={() => setCloseCaseDrawerOpen(false)}
                />
              )}
              {openNewV1CaseDialogOpen && (
                <OpenNewV1CaseDialog
                  partneringFamilyId={family.family!.id!}
                  referralId={openReferralId}
                  onClose={() => setOpenNewV1CaseDialogOpen(false)}
                />
              )}
            </Box>

            {permissions(Permission.ViewV1CaseComments) && selectedV1Case && (
              <Box
                sx={{
                  minWidth: 0,
                  pt: { xs: 0.25, md: 0 },
                }}
              >
                <V1CaseCommentsV2
                  compact
                  partneringFamily={family}
                  v1CaseId={selectedV1Case.id!}
                />
              </Box>
            )}
          </Box>
        </Box>
      )}

      {pinnedNotes.length > 0 && (
        <Box
          sx={{
            border: 1,
            borderColor: 'primary.light',
            borderRadius: 1,
            bgcolor: 'rgba(25, 118, 210, 0.06)',
            p: 1.5,
            mb: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {pinnedNotes.map((note) => (
              <Box
                key={note.id}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  p: 1.25,
                }}
              >
                <Typography
                  className="ph-unmask"
                  variant="caption"
                  color="text.secondary"
                >
                  <PersonName person={noteAuthorLookup(note)} />
                  {note.createdTimestampUtc
                    ? ` · ${format(note.createdTimestampUtc, 'M/d/yy h:mm a')}`
                    : ''}
                </Typography>
                <Typography className="ph-unmask" variant="body2">
                  {note.contents}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
      {isDesktop ? (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1.5 }}>
          <Tabs
            value={selectedTab}
            onChange={(_, nextTab) => setSelectedTab(nextTab)}
            aria-label="Family screen sections"
          >
            {familyScreenTabs.map((tab) => (
              <Tab key={tab.value} value={tab.value} label={tab.desktopLabel} />
            ))}
          </Tabs>
        </Box>
      ) : (
        <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
          <InputLabel id="family-screen-section-label">Section</InputLabel>
          <Select
            labelId="family-screen-section-label"
            id="family-screen-section-select"
            value={selectedTab}
            label="Section"
            onChange={handleSelectedTabChange}
          >
            {familyScreenTabs.map((tab) => (
              <MenuItem key={tab.value} value={tab.value}>
                {tab.mobileLabel}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
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
        {!showTimelineAndNotes && (
          <Grid
            item
            xs={12}
            lg={showOverview ? 8 : 12}
            sx={{ display: 'flex', flexDirection: 'column' }}
          >
          <Grid container spacing={2}>
            {showArrangementsOrAssignments && isVolunteerFamily && family && (
              <AssignmentsSection family={family} hideTitle />
            )}
          </Grid>

          <Grid container spacing={0} sx={{ order: 2 }}>
            {showOverview &&
              permissions(Permission.ViewV1CaseProgress) &&
              !referralsEnabled &&
              selectedV1Case &&
              v1CaseRequirementContext && (
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
                        context={v1CaseRequirementContext}
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
                          context={v1CaseRequirementContext}
                        />
                      )
                    )}
                    {selectedV1Case?.exemptedRequirements?.map(
                      (exempted, i) => (
                        <ExemptedRequirementRow
                          key={`${exempted.requirementName}:${i}`}
                          requirement={exempted}
                          context={v1CaseRequirementContext}
                        />
                      )
                    )}
                  </Grid>
                </>
              )}
            {showCaseHistory && (
              <Grid item xs={12}>
                <Box
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    p: 2,
                    mb: 2,
                  }}
                >
                  <Typography className="ph-unmask" variant="h3" sx={{ mb: 2 }}>
                    Case History
                  </Typography>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                  >
                    {caseReferralTable.caseRows.length === 0 ? (
                      <Typography color="text.secondary" variant="body2">
                        No cases yet.
                      </Typography>
                    ) : (
                      caseReferralTable.caseRows.map(
                        ({ v1Case, linkedReferrals }) => {
                          const isSelected = selectedV1Case?.id === v1Case.id;
                          const caseStatus = v1Case.closedAtUtc
                            ? 'Closed'
                            : 'Open';

                          return (
                            <ListItemButton
                              key={v1Case.id}
                              selected={isSelected}
                              onClick={() => setSelectedV1CaseId(v1Case.id)}
                              sx={{
                                alignItems: 'flex-start',
                                border: 1,
                                borderColor: isSelected
                                  ? 'primary.main'
                                  : 'divider',
                                borderRadius: 1,
                                gap: 2,
                              }}
                            >
                              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    flexWrap: 'wrap',
                                    mb: 0.5,
                                  }}
                                >
                                  <Typography
                                    className="ph-unmask"
                                    variant="body2"
                                    sx={{ fontWeight: 600 }}
                                  >
                                    {v1Case.closedAtUtc
                                      ? 'Closed Case'
                                      : 'Open Case'}
                                  </Typography>
                                  <Chip
                                    size="small"
                                    color={
                                      v1Case.closedAtUtc ? 'default' : 'success'
                                    }
                                    label={caseStatus}
                                  />
                                </Box>
                                <Typography
                                  className="ph-unmask"
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Opened {format(v1Case.openedAtUtc, 'M/d/yy')}
                                  {v1Case.closedAtUtc
                                    ? ` · Closed ${format(
                                        v1Case.closedAtUtc,
                                        'M/d/yy'
                                      )}`
                                    : ''}
                                  {v1Case.closeReason
                                    ? ` · ${v1Case.closeReason}`
                                    : ''}
                                </Typography>
                                {linkedReferrals.length > 0 && (
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      flexWrap: 'wrap',
                                      gap: 1,
                                      mt: 1,
                                    }}
                                  >
                                    {linkedReferrals.map((referral) => (
                                      <Chip
                                        key={referral.referralId}
                                        clickable
                                        size="small"
                                        label={`${referral.title} · ${formatStatusWithDate(
                                          referral.status,
                                          referral.createdAtUtc,
                                          referral.acceptedAtUtc,
                                          referral.closedAtUtc
                                        )}`}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          appNavigate.referral(
                                            referral.referralId
                                          );
                                        }}
                                      />
                                    ))}
                                  </Box>
                                )}
                              </Box>
                            </ListItemButton>
                          );
                        }
                      )
                    )}

                    {referralsEnabled &&
                      caseReferralTable.unlinkedReferrals.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mb: 1 }}
                          >
                            Referrals not linked to a case
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 1,
                            }}
                          >
                            {caseReferralTable.unlinkedReferrals.map(
                              (referral) => (
                                <Chip
                                  key={referral.referralId}
                                  clickable
                                  size="small"
                                  label={`${referral.title} · ${formatStatusWithDate(
                                    referral.status,
                                    referral.createdAtUtc,
                                    referral.acceptedAtUtc,
                                    referral.closedAtUtc
                                  )}`}
                                  onClick={() =>
                                    appNavigate.referral(referral.referralId)
                                  }
                                />
                              )
                            )}
                          </Box>
                        </Box>
                      )}
                  </Box>
                </Box>
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
                  v1Case={selectedV1Case}
                  family={family}
                  permissions={permissions}
                  hideTitle
                  scrollToArrangementId={arrangementIdToScrollTo}
                />
              )}

            {showOverview && (
              <Grid item xs={12}>
                <FamilyMembersDataGridV2
                  rows={familyMemberRows}
                  onAddAdult={openAddAdultDialog}
                  onAddChild={openAddChildDialog}
                  onArrangementClick={openArrangementFromFamilyMember}
                  onRowClick={openFamilyMemberDrawer}
                  canAddAdult={canEditFamilyInfo}
                  canAddChild={canEditFamilyInfo}
                />
              </Grid>
            )}
            {showOverview && (
              <Grid item xs={12}>
              {permissions(Permission.ViewFamilyCustomFields) &&
                orderCustomFieldsByPolicy(
                  Array<CustomFieldRenderInfo>()
                    .concat(family.family!.completedCustomFields)
                    .concat(family.missingCustomFields || []),
                  policy.customFamilyFields?.map((field) => field.name) ?? []
                ).map((customField) => (
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
              {permissions(Permission.ViewFamilyCustomFields) &&
                family.volunteerFamilyInfo &&
                orderCustomFieldsByPolicy(
                  Array<CustomFieldRenderInfo>()
                    .concat(
                      family.volunteerFamilyInfo.completedCustomFields || []
                    )
                    .concat(
                      family.volunteerFamilyInfo.missingCustomFields || []
                    ),
                  policy.volunteerPolicy?.customFields?.map(
                    (field) => field.name
                  ) ?? []
                ).map((customField) => (
                  <VolunteerFamilyCustomField
                    key={
                      typeof customField === 'string'
                        ? customField
                        : customField.customFieldName
                    }
                    familyId={familyId}
                    customField={customField}
                  />
                ))}

              <Grid item xs={12} md={4}>
                {permissions(Permission.ViewV1CaseCustomFields) &&
                  !referralsEnabled &&
                  (
                    selectedV1Case?.completedCustomFields ||
                    ([] as Array<CompletedCustomFieldInfo | string>)
                  )
                    .concat(selectedV1Case?.missingCustomFields || [])
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
                      <V1CaseCustomField
                        key={
                          typeof customField === 'string'
                            ? customField
                            : customField.customFieldName
                        }
                        partneringFamilyId={familyId}
                        v1CaseId={`${selectedV1Case!.id}`}
                        customField={customField}
                      />
                    ))}
              </Grid>
              </Grid>
            )}
            </Grid>
          </Grid>
        )}
        {showOverview && (
          <Grid item xs={12} lg={4}>
          <Box
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              ml: { lg: 2 },
              mb: 2,
              bgcolor: 'background.paper',
            }}
          >
            <Typography className="ph-unmask" variant="h3" sx={{ mb: 1 }}>
              Communities
            </Typography>
            {familyCommunityInfo.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                No communities.
              </Typography>
            ) : (
              familyCommunityInfo.map((communityInfo) => (
                <ListItemButton
                  key={communityInfo.community?.id}
                  sx={{
                    padding: '.5rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '5px',
                  }}
                  onClick={() =>
                    communityInfo.community?.id
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
                    slotProps={{
                      primary: {
                        color: theme.palette.primary.main,
                      },
                    }}
                  />
                </ListItemButton>
              ))
            )}
          </Box>
          <Box
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              ml: { lg: 2 },
              mt: { xs: 2, lg: 0 },
              bgcolor: 'background.paper',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Typography variant="h3" className="ph-unmask" sx={{ m: 0 }}>
                Recent Activity: Last 7 days
              </Typography>
              <Button
                size="small"
                onClick={() => setSelectedTab('timelineAndNotes')}
              >
                View All
              </Button>
            </Box>

            {recentOverviewTimelineItems.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                No recent activity in the last 7 days.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recentOverviewTimelineItems.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '32px 1fr',
                      columnGap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'text.secondary',
                      }}
                    >
                      {item.icon === 'check' ? (
                        '✔'
                      ) : item.icon === 'location' ? (
                        <PersonPinCircleIcon fontSize="small" />
                      ) : (
                        <NotesIcon fontSize="small" />
                      )}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        className="ph-unmask"
                        variant="caption"
                        color="text.secondary"
                      >
                        {format(item.timestamp, 'MMM d, h:mm a')}
                      </Typography>
                      <Typography className="ph-unmask" variant="body2">
                        {item.userId ? (
                          <PersonName person={userLookup(item.userId)} />
                        ) : item.note ? (
                          <PersonName person={noteAuthorLookup(item.note)} />
                        ) : (
                          item.title
                        )}
                      </Typography>
                      <Typography
                        className="ph-unmask"
                        variant="body2"
                        sx={{ fontWeight: 600 }}
                      >
                        {item.title}
                      </Typography>
                      {item.subtitle && (
                        <ClampTypography
                          className="ph-unmask"
                          variant="body2"
                          color="text.secondary"
                        >
                          {item.subtitle}
                        </ClampTypography>
                      )}
                      {renderRecentNoteActions(item)}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}
