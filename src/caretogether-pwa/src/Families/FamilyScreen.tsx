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
  Radio,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  CompletedCustomFieldInfo,
  Permission,
  V1Case,
  V1Referral,
  RoleRemovalReason,
  V1ReferralStatus,
} from '../GeneratedClient';
import { useParams } from 'react-router';
import {
  AddCircle as AddCircleIcon,
  CloudUpload as CloudUploadIcon,
  Diversity3 as Diversity3Icon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { AdultCard } from './AdultCard';
import { ChildCard } from './ChildCard';
import { useEffect, useRef, useState } from 'react';
import { AddAdultDialog } from './AddAdultDrawer';
import { AddChildDialog } from './AddChildDrawer';
import { AddEditNoteDrawer } from '../Notes/AddEditNoteDrawer';
import { format } from 'date-fns';
import { UploadFamilyDocumentsDrawer } from './UploadFamilyDocumentsDrawer';
import { CloseV1CaseDrawer } from '../V1Cases/CloseV1CaseDrawer';
import { OpenNewV1CaseDialog } from '../V1Cases/OpenNewV1CaseDialog';
import { FamilyDocuments } from './FamilyDocuments';
import { useFamilyPermissions } from '../Model/SessionModel';
import { AppMasonry } from '../Generic/AppMasonry';
import { MissingRequirementRow } from '../Requirements/MissingRequirementRow';
import { ExemptedRequirementRow } from '../Requirements/ExemptedRequirementRow';
import { CompletedRequirementRow } from '../Requirements/CompletedRequirementRow';
import {
  V1CaseContext,
  VolunteerFamilyContext,
} from '../Requirements/RequirementContext';
import { ActivityTimeline } from '../Activities/ActivityTimeline';
import { V1CaseComments } from '../V1Cases/V1CaseComments';
import { V1CaseCustomField } from '../V1Cases/V1CaseCustomField';
import { PrimaryContactEditor } from './PrimaryContactEditor';
import {
  useScreenTitleComponent,
  useScreenTitle,
} from '../Shell/ShellScreenTitle';
import {
  useCommunityLookup,
  useFamilyLookup,
  usePersonAndFamilyLookup,
  useDirectoryModel,
} from '../Model/DirectoryModel';
import { RemoveFamilyRoleDialog } from '../Volunteers/RemoveFamilyRoleDialog';
import { ResetFamilyRoleDialog } from '../Volunteers/ResetFamilyRoleDialog';
import { VolunteerRoleApprovalStatusChip } from '../Volunteers/VolunteerRoleApprovalStatusChip';
import { FamilyCustomField } from './FamilyCustomField';
import { VolunteerFamilyCustomField } from '../Volunteers/VolunteerFamilyCustomField';
import { DeleteFamilyDialog } from './DeleteFamilyDialog';
import { useDialogHandle } from '../Hooks/useDialogHandle';
import { familyLastName } from './FamilyUtils';
import { useLoadable } from '../Hooks/useLoadable';
import { visibleCommunitiesQuery } from '../Model/Data';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import posthog from 'posthog-js';
import { AssignmentsSection } from '../Families/AssignmentsSection';
import { useMemo } from 'react';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useSyncV1CaseIdInURL } from '../Hooks/useSyncV1CaseIdInURL';
import { ArrangementsSection } from '../V1Cases/Arrangements/ArrangementsSection/ArrangementsSection';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { TestFamilyBadge } from './TestFamilyBadge';
import { visibleReferralsQuery } from '../Model/Data';
import { useRecoilValue } from 'recoil';
import { FamilyCompleteOtherController } from '../Requirements/FamilyCompleteOtherController';
import { useV1CasesModel } from '../Model/V1CasesModel';
import { formatStatusWithDate } from '../V1Referrals/formatStatusWithDate';
import { useFeatureFlagEnabledWithLocalOverride } from '../Utilities/Instrumentation/useFeatureFlagWithLocalOverride';
import { policyData } from '../Model/ConfigurationModel';
import { FUNCTION_ASSIGNMENTS_FEATURE_FLAG } from '../featureFlags';
import { FunctionAssignmentsEditorDrawer } from '../FunctionAssignments/FunctionAssignmentsSection';
import {
  assignmentNamesForRole,
  assignmentRolesForColumns,
} from '../FunctionAssignments/assignmentRoleColumns';

type CustomFieldRenderInfo = CompletedCustomFieldInfo | string;

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

  const referralInfos = useRecoilValue(visibleReferralsQuery);

  const familyReferrals = useMemo(() => {
    return (referralInfos ?? [])
      .map((referralInfo) => referralInfo.referral)
      .filter((r) => r.familyId === familyId);
  }, [referralInfos, familyId]);

  function referralRequirementSummary(referral: V1Referral) {
    const incompleteCount =
      referral.missingIntakeRequirements?.filter(
        (requirement) => requirement.isRequired
      ).length ?? 0;
    const completedCount = referral.completedRequirements?.length ?? 0;
    const exemptedCount = referral.exemptedRequirements?.length ?? 0;

    return [
      incompleteCount > 0 ? `❌ ${incompleteCount}` : null,
      completedCount > 0 ? `✅ ${completedCount}` : null,
      exemptedCount > 0 ? `🚫 ${exemptedCount}` : null,
    ]
      .filter(Boolean)
      .join(' · ');
  }

  const appNavigate = useAppNavigate();

  const familyLookup = useFamilyLookup();
  const personAndFamilyLookup = usePersonAndFamilyLookup();
  const family = familyLookup(familyId);
  const policy = useRecoilValue(policyData);

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
            (r2.closedAtUtc?.getTime() ?? 0) - (r1.closedAtUtc?.getTime() ?? 0)
        );
  }, [family?.partneringFamilyInfo?.closedV1Cases]);

  const allV1Cases: V1Case[] = useMemo(() => {
    return [...openV1Cases, ...closedV1Cases];
  }, [openV1Cases, closedV1Cases]);
  const [closeCaseDrawerOpen, setCloseCaseDrawerOpen] = useState(false);
  const v1CasesModel = useV1CasesModel();
  const referralInfosLoadable = useLoadable(visibleReferralsQuery);
  const openReferralId =
    referralInfosLoadable
      ?.map((referralInfo) => referralInfo.referral)
      .find(
        (r) => r.familyId === familyId && r.status === V1ReferralStatus.Open
      )?.referralId ?? undefined;
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
  const [
    functionAssignmentsEditorV1CaseId,
    setFunctionAssignmentsEditorV1CaseId,
  ] = useState<string | undefined>();

  const selectedV1Case = allV1Cases.find(
    (v1Case) => v1Case.id === selectedV1CaseId
  );
  const functionAssignmentsEditorV1Case = allV1Cases.find(
    (v1Case) => v1Case.id === functionAssignmentsEditorV1CaseId
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
  const referralsEnabled = useFeatureFlagEnabledWithLocalOverride('referrals');
  const functionAssignmentsEnabled = useFeatureFlagEnabled(
    FUNCTION_ASSIGNMENTS_FEATURE_FLAG
  );
  const canViewFunctionAssignments =
    functionAssignmentsEnabled === true &&
    permissions(Permission.ViewV1CaseFunctionAssignments);
  const canEditFunctionAssignments =
    canViewFunctionAssignments &&
    permissions(Permission.EditV1CaseFunctionAssignments);
  const functionAssignmentRoles = useMemo(() => {
    if (!canViewFunctionAssignments) return [];

    return assignmentRolesForColumns(
      policy.referralPolicy?.functionAssignmentPolicies?.map(
        (assignmentPolicy) => assignmentPolicy.assignmentRole
      ) ?? [],
      allV1Cases.flatMap((v1Case) => v1Case.assignedIndividualVolunteers ?? [])
    );
  }, [
    allV1Cases,
    canViewFunctionAssignments,
    policy.referralPolicy?.functionAssignmentPolicies,
  ]);

  useScreenTitle(family ? `${familyLastName(family)} Family` : '...');
  useScreenTitleComponent(family ? <TestFamilyBadge family={family} /> : null);

  function handleV1CaseChange(v1CaseId: string) {
    setSelectedV1CaseId(v1CaseId);
  }

  const printContentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef: printContentRef });

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
        {permissions(Permission.EditFamilyInfo) &&
          permissions(Permission.ViewFamilyChildren) && (
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
          permissions(Permission.EditFamilyInfo) ||
          (family.volunteerFamilyInfo != null &&
            permissions(Permission.EditApprovalRequirementCompletion))) && (
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
          <UploadFamilyDocumentsDrawer
            family={family}
            onClose={() => setUploadDocumentDialogOpen(false)}
          />
        )}
        {addAdultDialogOpen && (
          <AddAdultDialog
            onClose={() => setAddAdultDialogOpen(false)}
          ></AddAdultDialog>
        )}
        {addChildDialogOpen && (
          <AddChildDialog
            onClose={() => setAddChildDialogOpen(false)}
          />
        )}
        {addNoteDialogOpen && (
          <AddEditNoteDrawer
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
      </Toolbar>
      <Grid container spacing={0}>
        <Grid item xs={12} md={4} spacing={0}>
          <ActivityTimeline
            family={family}
            referrals={familyReferrals}
            printContentRef={printContentRef}
          />
        </Grid>
        <Grid item md={8}>
          <Grid container spacing={2}>
            <Grid item md={4}>
              <PrimaryContactEditor family={family} />
            </Grid>
            <Grid item md={8}>
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
                      slotProps={{
                        primary: {
                          color: theme.palette.primary.main,
                        },
                      }}
                    ></ListItemText>
                  </ListItemButton>
                );
              })}
            </Grid>

            {family && <AssignmentsSection family={family} />}

            <Grid item xs={12}>
              {permissions(Permission.ViewV1CaseProgress) && (
                <Box sx={{ mt: 2 }}>
                  <Typography className="ph-unmask" variant="h3" sx={{ mb: 1 }}>
                    Cases & Referrals
                  </Typography>

                  {!referralsEnabled &&
                    (!family.partneringFamilyInfo ||
                      !family.partneringFamilyInfo.openV1Case) &&
                    permissions(Permission.CreateV1Case) && (
                      <Button
                        className="ph-unmask"
                        onClick={() => setOpenNewV1CaseDialogOpen(true)}
                        variant="contained"
                        size="small"
                        sx={{ mb: 1 }}
                      >
                        Open New Case
                      </Button>
                    )}

                  <TableContainer
                    sx={{
                      width: '100%',
                      border: '1px solid rgba(224,224,224,1)',
                      borderRadius: 1,
                    }}
                  >
                    <Table size="small" sx={{ width: '100%' }}>
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{
                              fontWeight: 600,
                              width: '1%',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Case
                          </TableCell>
                          {functionAssignmentRoles.map((assignmentRole) => (
                            <TableCell
                              key={assignmentRole}
                              sx={{
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {assignmentRole}
                            </TableCell>
                          ))}
                          {referralsEnabled && (
                            <TableCell sx={{ fontWeight: 600, width: '100%' }}>
                              Linked Referrals
                            </TableCell>
                          )}
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {caseReferralTable.caseRows.map(
                          ({ v1Case, linkedReferrals }) => {
                            const isSelected = selectedV1Case?.id === v1Case.id;

                            const isOpenV1Case = !v1Case.closedAtUtc;
                            const caseCloseReasonText =
                              !isOpenV1Case && v1Case.closeReason
                                ? v1Case.closeReason
                                : undefined;

                            const showCloseButton =
                              isSelected &&
                              isOpenV1Case &&
                              canCloseV1Case &&
                              v1Case.id ===
                                family.partneringFamilyInfo?.openV1Case?.id;

                            return (
                              <TableRow key={v1Case.id} hover>
                                <TableCell
                                  onClick={() => handleV1CaseChange(v1Case.id)}
                                  sx={{
                                    width: '1%',
                                    whiteSpace: 'nowrap',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1,
                                    }}
                                  >
                                    <Radio
                                      checked={isSelected}
                                      onChange={() =>
                                        handleV1CaseChange(v1Case.id)
                                      }
                                    />
                                    <Typography className="ph-unmask">
                                      {v1Case.closedAtUtc
                                        ? `Case Closed ${format(
                                            v1Case.closedAtUtc,
                                            'M/d/yy'
                                          )}`
                                        : 'Open Case'}
                                    </Typography>

                                    {caseCloseReasonText && (
                                      <Typography
                                        className="ph-unmask"
                                        color="text.secondary"
                                      >
                                        {caseCloseReasonText}
                                      </Typography>
                                    )}

                                    {showCloseButton && (
                                      <Button
                                        className="ph-unmask"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setCloseCaseDrawerOpen(true);
                                        }}
                                        variant="contained"
                                        size="small"
                                      >
                                        Close Case
                                      </Button>
                                    )}
                                    {isSelected &&
                                      !isOpenV1Case &&
                                      canReopenSelectedV1Case && (
                                        <Button
                                          className="ph-unmask"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            void reopenCaseNow();
                                          }}
                                          variant="contained"
                                          size="small"
                                        >
                                          Reopen Case
                                        </Button>
                                      )}
                                  </Box>
                                </TableCell>

                                {functionAssignmentRoles.map(
                                  (assignmentRole) => {
                                    const assignmentNames =
                                      assignmentNamesForRole(
                                        v1Case.assignedIndividualVolunteers ??
                                          [],
                                        assignmentRole,
                                        (personId) =>
                                          personAndFamilyLookup(personId).person
                                      );

                                    return (
                                      <TableCell
                                        key={assignmentRole}
                                        sx={{ whiteSpace: 'nowrap' }}
                                      >
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                          }}
                                        >
                                          {assignmentNames || (
                                            <Typography color="text.secondary">
                                              —
                                            </Typography>
                                          )}
                                          {canEditFunctionAssignments && (
                                            <IconButton
                                              aria-label={`Edit ${assignmentRole} assignment`}
                                              size="small"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setFunctionAssignmentsEditorV1CaseId(
                                                  v1Case.id
                                                );
                                              }}
                                            >
                                              <EditIcon
                                                color="primary"
                                                fontSize="small"
                                              />
                                            </IconButton>
                                          )}
                                        </Box>
                                      </TableCell>
                                    );
                                  }
                                )}

                                {referralsEnabled && (
                                  <TableCell sx={{ width: '100%' }}>
                                    {linkedReferrals.length === 0 ? (
                                      <Typography color="text.secondary">
                                        —
                                      </Typography>
                                    ) : (
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          flexWrap: 'wrap',
                                          gap: 1,
                                        }}
                                      >
                                        {linkedReferrals.map((ref) => {
                                          const requirementSummary =
                                            referralRequirementSummary(ref);

                                          const metadata = [
                                            formatStatusWithDate(
                                              ref.status,
                                              ref.createdAtUtc,
                                              ref.acceptedAtUtc,
                                              ref.closedAtUtc
                                            ),
                                            requirementSummary || null,
                                          ]
                                            .filter(Boolean)
                                            .join(' · ');

                                          return (
                                            <Chip
                                              key={ref.referralId}
                                              clickable
                                              size="small"
                                              label={`${ref.title} · ${metadata}`}
                                              onClick={() =>
                                                appNavigate.referral(
                                                  ref.referralId
                                                )
                                              }
                                            />
                                          );
                                        })}
                                      </Box>
                                    )}
                                  </TableCell>
                                )}
                              </TableRow>
                            );
                          }
                        )}

                        {referralsEnabled &&
                          caseReferralTable.unlinkedReferrals.length > 0 && (
                            <TableRow>
                              <TableCell
                                sx={{
                                  width: '1%',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                (not linked to a case)
                              </TableCell>
                              {functionAssignmentRoles.map((assignmentRole) => (
                                <TableCell key={assignmentRole}>
                                  <Typography color="text.secondary">
                                    —
                                  </Typography>
                                </TableCell>
                              ))}
                              <TableCell sx={{ width: '100%' }}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 1,
                                  }}
                                >
                                  {caseReferralTable.unlinkedReferrals.map(
                                    (ref) => {
                                      const requirementSummary =
                                        referralRequirementSummary(ref);

                                      const metadata = [
                                        formatStatusWithDate(
                                          ref.status,
                                          ref.createdAtUtc,
                                          ref.acceptedAtUtc,
                                          ref.closedAtUtc
                                        ),
                                        requirementSummary || null,
                                      ]
                                        .filter(Boolean)
                                        .join(' · ');

                                      return (
                                        <Chip
                                          key={ref.referralId}
                                          clickable
                                          size="small"
                                          label={`${ref.title} · ${metadata}`}
                                          onClick={() =>
                                            appNavigate.referral(ref.referralId)
                                          }
                                        />
                                      );
                                    }
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {functionAssignmentsEditorV1Case && (
                    <FunctionAssignmentsEditorDrawer
                      open
                      assignments={
                        functionAssignmentsEditorV1Case.assignedIndividualVolunteers ??
                        []
                      }
                      policies={
                        policy.referralPolicy?.functionAssignmentPolicies ?? []
                      }
                      onClose={() =>
                        setFunctionAssignmentsEditorV1CaseId(undefined)
                      }
                      onAssign={(personId, assignmentRole) =>
                        v1CasesModel.assignIndividualVolunteerToV1Case(
                          familyId,
                          functionAssignmentsEditorV1Case.id,
                          personId,
                          assignmentRole
                        )
                      }
                      onUnassign={(personId, assignmentRole) =>
                        v1CasesModel.unassignIndividualVolunteerFromV1Case(
                          familyId,
                          functionAssignmentsEditorV1Case.id,
                          personId,
                          assignmentRole
                        )
                      }
                    />
                  )}
                </Box>
              )}
            </Grid>

            <Grid item xs={6} md={4}>
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
            {permissions(Permission.ViewV1CaseProgress) &&
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
              <Grid item xs={12} lg={8} xl={5} mb={2}>
                <Typography
                  className="ph-unmask"
                  variant="h3"
                  style={{ marginBottom: 0 }}
                >
                  Documents
                </Typography>
                <FamilyDocuments family={family} referrals={familyReferrals} />
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
              <Typography className="ph-unmask" variant="h3" sx={{ mb: 1 }}>
                Family Members
              </Typography>
              <AppMasonry
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
                {permissions(Permission.ViewFamilyChildren) &&
                  family.family?.children?.map(
                    (child) =>
                      child.active && (
                        <ChildCard
                          key={child.id!}
                          familyId={familyId}
                          personId={child.id!}
                        />
                      )
                  )}
              </AppMasonry>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}
