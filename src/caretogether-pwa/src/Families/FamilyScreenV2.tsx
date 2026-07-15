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
  ListItemIcon,
  Typography,
  Tooltip,
} from '@mui/material';
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
  Arrangement,
  ArrangementPhase,
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
  DeleteForever as DeleteForeverIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FamilyDocuments } from './FamilyDocuments';
import {
  useFamilyPermissions,
  useGlobalPermissions,
} from '../Model/SessionModel';
import {
  IndividualVolunteerContext,
  V1CaseContext,
} from '../Requirements/RequirementContext';
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
import { getFilteredArrangements } from '../V1Cases/Arrangements/ArrangementsSection/getFilteredArrangements';
import {
  ArrangementRowV2,
  buildArrangementRowsV2,
} from '../V1Cases/Arrangements/arrangementViewModel';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { TestFamilyBadge } from './TestFamilyBadge';
import { visibleReferralsQuery } from '../Model/Data';
import { useRecoilValue } from 'recoil';
import { useV1CasesModel } from '../Model/V1CasesModel';
import { policyData } from '../Model/ConfigurationModel';
import { FAMILY_MEMBER_PRINT_INFORMATION_FEATURE_FLAG } from '../featureFlags';
import { personNameString } from './PersonName';
import { buildGroupedV1ReferralTimelineEntries } from '../V1Referrals/referralTimelineHelpers';
import { useGlobalSnackBar } from '../Hooks/useGlobalSnackBar';
import { ApprovalLedgerSection } from './ApprovalLedgerSection';
import { buildApprovalLedgerRows } from './approvalLedgerViewModel';
import {
  buildRemovedRoleSummaries,
  buildRoleSummaryCards,
} from './roleSummaryViewModel';
import { RoleSummaryCardsSection } from './RoleSummaryCardsSection';
import { accountInfoState } from '../Authentication/Auth';
import { useLocation } from 'react-router-dom';
import { combineCustomFieldPolicies } from './familyMemberCustomFieldPolicies';
import {
  buildPrintableCustomFieldSections,
  personFullName,
  type PrintableFamilyMember,
} from './FamilyMemberPrintData';
import { FamilyMemberPrintDocument } from './FamilyMemberPrintDocument';
import { FamilyPrimaryHeaderInfoV2 } from './FamilyPrimaryHeaderInfoV2';
import {
  ActiveCaseArrangementSummaryV2,
  FamilyCaseWorkspaceHeaderV2,
} from './FamilyCaseWorkspaceHeaderV2';
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
import {
  buildFamilyMemberRowsV2,
  FamilyMemberRowV2,
} from './familyMemberViewModel';

type CustomFieldRenderInfo = CompletedCustomFieldInfo | string;
type ReferralNoteEntry = NonNullable<V1Referral['notes']>[number];
type RecentNoteAction = 'edit' | 'approve' | 'delete';
function isActiveCaseArrangement(arrangement: Arrangement) {
  return (
    arrangement.phase === ArrangementPhase.SettingUp ||
    arrangement.phase === ArrangementPhase.ReadyToStart ||
    arrangement.phase === ArrangementPhase.Started
  );
}

function activeArrangementStatusLabel(phase?: ArrangementPhase) {
  if (phase === ArrangementPhase.SettingUp) return 'Setting up';
  if (phase === ArrangementPhase.ReadyToStart) return 'Ready to start';
  if (phase === ArrangementPhase.Started) return 'Active';
  return 'Active';
}

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
  const [selectedArrangementRowId, setSelectedArrangementRowId] = useState<
    string | null
  >(null);

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

  const selectedCaseArrangementRows = useMemo<ArrangementRowV2[]>(() => {
    if (!family || !selectedV1Case) return [];

    return buildArrangementRowsV2({
      arrangements: getFilteredArrangements(selectedV1Case, []),
      arrangementPolicies: policy.referralPolicy?.arrangementPolicies,
      family,
      v1Case: selectedV1Case,
      personLabel: (personFamilyId, personId) =>
        personNameString(personLookup(personFamilyId, personId)),
      familyLabel: (arrangementFamilyId) => {
        const matchedFamily = familyLookup(arrangementFamilyId);
        const primaryContactPerson = matchedFamily?.family?.adults?.find(
          (adult) =>
            adult.item1?.id ===
            matchedFamily.family?.primaryFamilyContactPersonId
        )?.item1;

        return primaryContactPerson
          ? `${personNameString(primaryContactPerson)} Family`
          : 'Family';
      },
    });
  }, [family, familyLookup, personLookup, policy, selectedV1Case]);

  const selectedArrangementRow = useMemo(
    () =>
      selectedCaseArrangementRows.find(
        (row) => row.id === selectedArrangementRowId
      ) ?? null,
    [selectedCaseArrangementRows, selectedArrangementRowId]
  );

  function openArrangementWorkspace(row: ArrangementRowV2) {
    setSelectedArrangementRowId(row.id);
  }

  const activeCaseArrangements = useMemo<
    ActiveCaseArrangementSummaryV2[]
  >(() => {
    return selectedCaseArrangementRows
      .filter((row) => row.id && isActiveCaseArrangement(row.source))
      .map((row) => {
        return {
          id: row.id,
          arrangementType: row.arrangementType,
          arrangedPersonLabel: row.childOrPersonLabel || 'Unassigned',
          currentLocationLabel:
            row.currentLocationLabel || 'Location unspecified',
          phase: row.source.phase,
          relevantDateLabel: row.startedDate
            ? `Started ${row.startedDate}`
            : row.requestedDate
              ? `Requested ${row.requestedDate}`
              : undefined,
          statusLabel: activeArrangementStatusLabel(row.source.phase),
        };
      });
  }, [selectedCaseArrangementRows]);

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
          activity,
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
  const canViewFamilyCustomFields = permissions(Permission.ViewFamilyCustomFields);
  const canViewV1CaseCustomFields =
    permissions(Permission.ViewV1CaseCustomFields) && !referralsEnabled;
  const showV1CaseRequirements =
    permissions(Permission.ViewV1CaseProgress) &&
    !referralsEnabled &&
    selectedV1Case !== undefined &&
    v1CaseRequirementContext !== undefined;
  const overviewFamilyCustomFields = canViewFamilyCustomFields
    ? orderCustomFieldsByPolicy(
        Array<CustomFieldRenderInfo>()
          .concat(family.family!.completedCustomFields)
          .concat(family.missingCustomFields || []),
        policy.customFamilyFields?.map((field) => field.name) ?? []
      )
    : [];
  const overviewVolunteerFamilyCustomFields =
    canViewFamilyCustomFields && family.volunteerFamilyInfo
      ? orderCustomFieldsByPolicy(
          Array<CustomFieldRenderInfo>()
            .concat(family.volunteerFamilyInfo.completedCustomFields || [])
            .concat(family.volunteerFamilyInfo.missingCustomFields || []),
          policy.volunteerPolicy?.customFields?.map((field) => field.name) ?? []
        )
      : [];
  const overviewV1CaseCustomFields = canViewV1CaseCustomFields
    ? (
        selectedV1Case?.completedCustomFields ||
        ([] as Array<CompletedCustomFieldInfo | string>)
      )
        .concat(selectedV1Case?.missingCustomFields || [])
        .sort((a, b) =>
          (a instanceof CompletedCustomFieldInfo ? a.customFieldName! : a) <
          (b instanceof CompletedCustomFieldInfo ? b.customFieldName! : b)
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
    : [];
  const overviewCommunityRows = familyCommunityInfo.map((communityInfo) => ({
    id: communityInfo.community?.id,
    name: communityInfo.community?.name,
  }));

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
            }}
          >
            <FamilyPrimaryHeaderInfoV2
              family={family}
              primaryEmailAddress={primaryEmailAddress?.address}
              primaryPhoneNumber={primaryPhoneNumber?.number}
              primaryAddressText={primaryAddressText}
              onCopied={setAndShowGlobalSnackBar}
            />
            {!isDesktop && hasFamilyActions && (
              <IconButton
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
                    primary={
                      <>
                        <span className="ph-unmask">Print </span>
                        {personFullName(member.person)}
                        <span className="ph-unmask"> information</span>
                      </>
                    }
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
          onOpenNewV1CaseDialogClose={() =>
            setOpenNewV1CaseDialogOpen(false)
          }
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
      {isPartneringFamily && (
        <FamilyCaseWorkspaceHeaderV2
          activeCaseArrangements={activeCaseArrangements}
          canCloseV1Case={!!canCloseV1Case}
          canOpenNewCase={permissions(Permission.CreateV1Case)}
          canReopenSelectedV1Case={canReopenSelectedV1Case}
          canViewV1CaseComments={permissions(Permission.ViewV1CaseComments)}
          currentReferral={currentReferral}
          family={family}
          referralsEnabled={referralsEnabled}
          selectedV1Case={selectedV1Case}
          onArrangementOpen={setSelectedArrangementRowId}
          onCloseCase={() => setCloseCaseDrawerOpen(true)}
          onOpenNewCase={() => setOpenNewV1CaseDialogOpen(true)}
          onReopenCase={() => void reopenCaseNow()}
          onViewReferral={(referralId) => appNavigate.referral(referralId)}
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
            onCommunityClick={(communityId) => appNavigate.community(communityId)}
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
