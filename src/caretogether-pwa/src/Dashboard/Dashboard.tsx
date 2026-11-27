import { Suspense, useId, useMemo, useState, type ReactNode } from 'react';
import {
  Box,
  Button,
  Chip,
  Container,
  List,
  ListItem,
  MenuItem,
  Paper,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  Check as CheckIcon,
  DeleteForever as DeleteForeverIcon,
  Edit as EditIcon,
  EventAvailableOutlined,
  EventBusyOutlined,
  FactCheckOutlined,
  VerifiedUserOutlined,
} from '@mui/icons-material';
import { useAccountInfo } from '../Authentication/Auth';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import {
  FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG,
  ORGANIZATION_APPROVALS_FEATURE_FLAG,
  REFERRALS_FEATURE_FLAG,
} from '../featureFlags';
import { familyNameString } from '../Families/FamilyName';
import { personNameString } from '../Families/PersonName';
import { v2Typography } from '../Families/v2Typography';
import type { CombinedFamilyInfo } from '../GeneratedClient';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { useLocationConfiguration } from '../Model/ConfigurationModel';
import {
  useCurrentLocation,
  useSelectedLocationContext,
  useVisibleFamilies,
  useVisibleReferrals,
} from '../Model/Data';
import { AddEditNoteDrawer } from '../Notes/AddEditNoteDrawer';
import { AddEditNoteDialog } from '../Notes/AddEditNoteDialog';
import { ApproveNoteDialog } from '../Notes/ApproveNoteDialog';
import { DiscardNoteDialog } from '../Notes/DiscardNoteDialog';
import { AddEditV1ReferralNoteDrawer } from '../V1Referrals/AddEditV1ReferralNoteDrawer';
import { ApproveV1ReferralNoteDialog } from '../V1Referrals/ApproveV1ReferralNoteDialog';
import { DiscardV1ReferralNoteDialog } from '../V1Referrals/DiscardV1ReferralNoteDialog';
import type { RecentNoteActionKind } from '../Families/useRecentFamilyNoteActions';
import {
  useCommunityLookup,
  useFamilyLookup,
  useNoteAuthorLookup,
  usePersonAndFamilyLookup,
  useUserLookup,
} from '../Model/DirectoryModel';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { formatUtcDateOnly } from '../Utilities/dateUtils';
import { format } from 'date-fns';
import {
  buildDashboardNoteReview,
  filterDashboardNoteReview,
} from './dashboardNoteReview';
import type { ArrangementWorkQueueItem } from './arrangementWorkQueue';
import type { ApprovalExpirationWorkItem } from './approvalExpirationWorkQueue';
import {
  openDashboardApproval,
  openDashboardArrangement,
} from './dashboardWorkNavigation';
import {
  DashboardRequirementPanel,
  DashboardRequirementRow,
  DashboardQueueRow,
} from './DashboardRequirementPanel';
import {
  affectedApprovalRoleLabel,
  selectDashboardApprovalWork,
} from './dashboardApprovalRenewals';
import {
  locationCalendarDate,
  selectDashboardRequirements,
} from './dashboardRequirements';
import {
  dashboardPreferencesKey,
  readDashboardPreferences,
  requirementWindowDays,
  writeDashboardPreferences,
  type DashboardPreferences,
  type RequirementWindowDays,
} from './dashboardPreferences';
import { useApprovalExpirationWorkQueue } from './useApprovalExpirationWorkQueue';
import { useApprovalRenewalWorkQueue } from './useApprovalRenewalWorkQueue';
import { useArrangementWorkQueue } from './useArrangementWorkQueue';

const upcomingPanel = {
  title: 'Upcoming requirements',
  icon: <EventAvailableOutlined fontSize="small" />,
  emptyTitle: 'Nothing due in this window',
  emptyMessage: 'No upcoming requirements in the next 30 days.',
};
const pastDuePanel = {
  title: 'Past-due requirements',
  icon: <EventBusyOutlined fontSize="small" />,
  emphasis: 'error' as const,
  emptyTitle: 'No overdue work',
  emptyMessage: 'No past-due requirements.',
};
const expirationPanel = {
  title: 'Expiring approvals and requirements',
  icon: <VerifiedUserOutlined fontSize="small" />,
  emptyTitle: 'All clear in this view',
  emptyMessage: 'No approvals or renewals require attention in this view.',
  emptyIcon: <VerifiedUserOutlined fontSize="small" color="action" />,
  itemType: 'approval work item',
  loadingMessage: 'Loading approvals and requirements…',
} as const;

function ApprovalWorkSection({
  title,
  count,
  itemType,
  children,
}: {
  title: string;
  count: number;
  itemType: 'approval' | 'renewal';
  children: ReactNode;
}) {
  const headingId = useId();
  if (!count) return null;

  return (
    <ListItem disablePadding sx={{ display: 'block' }}>
      <Box component="section" aria-labelledby={headingId}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ px: 2, py: 1, alignItems: 'center', bgcolor: 'action.hover' }}
        >
          <Typography
            id={headingId}
            className="ph-unmask"
            component="h3"
            variant="subtitle2"
            sx={{ fontWeight: 600, minWidth: 0, overflowWrap: 'anywhere' }}
          >
            {title}
          </Typography>
          <Chip
            size="small"
            label={count}
            aria-label={`${count} ${itemType}${count === 1 ? '' : 's'}`}
            sx={{ height: 22, fontWeight: 500, flexShrink: 0 }}
          />
        </Stack>
        <List disablePadding>{children}</List>
      </Box>
    </ListItem>
  );
}

function NextDaysSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: RequirementWindowDays;
  onChange: (days: RequirementWindowDays) => void;
}) {
  return (
    <Select
      size="small"
      value={value}
      inputProps={{ 'aria-label': label }}
      sx={{ ml: { sm: 'auto' }, maxWidth: '100%' }}
      onChange={({ target: { value: next } }) => {
        const days = requirementWindowDays.find(
          (option) => String(option) === String(next)
        );
        if (days) onChange(days);
      }}
    >
      {requirementWindowDays.map((days) => (
        <MenuItem key={days} value={days}>
          Next {days} days
        </MenuItem>
      ))}
    </Select>
  );
}

function disclosedFamilyName(family?: CombinedFamilyInfo) {
  const contactId = family?.family?.primaryFamilyContactPersonId;
  const contact =
    contactId &&
    family?.family?.adults?.find(({ item1 }) => item1?.id === contactId)?.item1;
  return contact && (contact.firstName?.trim() || contact.lastName?.trim())
    ? familyNameString(family)
    : undefined;
}

function DashboardApprovalExpirations({
  days,
  onChange,
  familyV2,
  work,
}: {
  work: ReturnType<typeof selectDashboardApprovalWork>;
  days: RequirementWindowDays;
  onChange: (days: RequirementWindowDays) => void;
  familyV2: boolean;
}) {
  const organizationApprovals =
    useFeatureFlagEnabled(ORGANIZATION_APPROVALS_FEATURE_FLAG) === true;
  const familyLookup = useFamilyLookup();
  const personLookup = usePersonAndFamilyLookup();
  const communityLookup = useCommunityLookup();
  const navigate = useAppNavigate();
  const { upcoming, uncovered, expiring, expired } = work;

  function subjectContext(target: ApprovalExpirationWorkItem['target']) {
    switch (target.kind) {
      case 'family':
        return disclosedFamilyName(familyLookup(target.familyId)) ?? 'Family';
      case 'individual': {
        const { person, family } = personLookup(target.familyMemberId);
        return family?.id === target.familyId &&
          person &&
          (person.firstName?.trim() || person.lastName?.trim())
          ? personNameString(person)
          : 'Family member';
      }
      case 'organization':
        return (
          communityLookup(target.communityId)?.community?.name?.trim() ||
          'Organization'
        );
    }
  }

  function destination(
    target: ApprovalExpirationWorkItem['target'],
    approval: { kind: 'role' | 'requirement'; name: string }
  ) {
    return {
      context: subjectContext(target),
      onOpen: () =>
        openDashboardApproval(navigate, target, approval, {
          familyV2,
          organizationApprovals,
        }),
    };
  }

  function renewalRow(row: (typeof upcoming)[number], isUncovered: boolean) {
    return (
      <DashboardQueueRow
        key={row.renderKey}
        title={row.actionName}
        {...destination(row.target, {
          kind: 'requirement',
          name: row.actionName,
        })}
      >
        <Typography
          component="span"
          variant="body2"
          color={isUncovered ? 'error.main' : 'text.secondary'}
        >
          <span className="ph-unmask">
            {isUncovered ? 'Uncovered since' : 'Projected coverage loss on'}
          </span>{' '}
          <time dateTime={row.firstUncoveredOnUtc}>
            {formatUtcDateOnly(new Date(row.firstUncoveredOnUtc))}
          </time>
        </Typography>
        {row.dateReached && (
          <Typography
            className="ph-unmask"
            component="span"
            variant="body2"
            color="text.secondary"
          >
            Coverage-loss date reached. Last reported as upcoming.
          </Typography>
        )}
        {row.affectedRoles.length > 0 && (
          <Typography component="span" variant="body2" color="text.secondary">
            <span className="ph-unmask">Affected roles</span>{' '}
            {row.affectedRoles.map(affectedApprovalRoleLabel).join(' · ')}
          </Typography>
        )}
      </DashboardQueueRow>
    );
  }

  return (
    <DashboardRequirementPanel
      {...expirationPanel}
      count={
        upcoming.length + uncovered.length + expiring.length + expired.length
      }
      headerAction={
        <NextDaysSelect
          label="Expiring approvals and requirements time frame"
          value={days}
          onChange={onChange}
        />
      }
    >
      <ApprovalWorkSection
        title="Upcoming renewals"
        count={upcoming.length}
        itemType="renewal"
      >
        {upcoming.map((item) => renewalRow(item, false))}
      </ApprovalWorkSection>
      <ApprovalWorkSection
        title="Expiring approvals"
        count={expiring.length}
        itemType="approval"
      >
        {expiring.map(
          ({ id, target, roleName, expirationDate, relatedRenewals }) => (
            <DashboardQueueRow
              key={id}
              title={roleName}
              {...destination(target, { kind: 'role', name: roleName })}
            >
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
              >
                <span className="ph-unmask">Expires on</span>{' '}
                <time dateTime={expirationDate}>
                  {formatUtcDateOnly(new Date(expirationDate))}
                </time>
              </Typography>
              {relatedRenewals.length > 0 && (
                <Typography
                  component="span"
                  variant="body2"
                  color="text.secondary"
                >
                  <span className="ph-unmask">Related renewals</span>{' '}
                  {relatedRenewals
                    .map(
                      (item) =>
                        `${item.actionName} (${subjectContext(item.target)})`
                    )
                    .join(' · ')}
                </Typography>
              )}
            </DashboardQueueRow>
          )
        )}
      </ApprovalWorkSection>
      <ApprovalWorkSection
        title="Expired approvals"
        count={expired.length}
        itemType="approval"
      >
        {expired.map(({ id, target, roleName, expirationDate }) => (
          <DashboardQueueRow
            key={id}
            title={roleName}
            {...destination(target, { kind: 'role', name: roleName })}
          >
            <Typography component="span" variant="body2" color="text.secondary">
              <span className="ph-unmask">Expired on</span>{' '}
              <time dateTime={expirationDate}>
                {formatUtcDateOnly(new Date(expirationDate))}
              </time>
            </Typography>
          </DashboardQueueRow>
        ))}
      </ApprovalWorkSection>
      <ApprovalWorkSection
        title="Expired and unresolved"
        count={uncovered.length}
        itemType="renewal"
      >
        {uncovered.map((item) => renewalRow(item, true))}
      </ApprovalWorkSection>
    </DashboardRequirementPanel>
  );
}

const noteReviewPanel = {
  title: 'Notes awaiting review',
  icon: <FactCheckOutlined fontSize="small" />,
  emptyTitle: 'Review queue clear',
  emptyMessage: 'No notes awaiting review.',
  itemType: 'note',
} as const;

function useDashboardNoteReview() {
  const families = useVisibleFamilies();
  const referrals = useVisibleReferrals();
  const familyLookup = useFamilyLookup();
  const userId = useAccountInfo()?.userId;
  const roles = useCurrentLocation()?.roles;
  const accessLevels = useLocationConfiguration()?.accessLevels;
  return useMemo(
    () =>
      buildDashboardNoteReview(
        families,
        referrals,
        (id) => disclosedFamilyName(familyLookup(id)),
        { userId, roles, accessLevels }
      ),
    [families, referrals, familyLookup, userId, roles, accessLevels]
  );
}

type ReviewNote = ReturnType<typeof useDashboardNoteReview>[number];

function noteKey(item: ReviewNote) {
  return JSON.stringify([item.source, item.recordId, item.id]);
}

function DashboardNoteReview({
  familyV2,
  referralsEnabled,
  source,
  onChange,
  items,
  visible,
  onAction,
}: {
  familyV2: boolean;
  referralsEnabled: boolean;
  source: DashboardPreferences['noteReviewSource'];
  onChange: (source: DashboardPreferences['noteReviewSource']) => void;
  items: ReturnType<typeof useDashboardNoteReview>;
  visible: ReturnType<typeof filterDashboardNoteReview>;
  onAction: (item: ReviewNote, action: RecentNoteActionKind) => void;
}) {
  const familyLookup = useFamilyLookup();
  const noteAuthor = useNoteAuthorLookup();
  const userLookup = useUserLookup();
  const navigate = useAppNavigate();
  const familyCount = items.filter(({ source }) => source === 'family').length;
  return (
    <DashboardRequirementPanel
      {...noteReviewPanel}
      emptyTitle={
        items.length ? 'No notes for this source' : noteReviewPanel.emptyTitle
      }
      emptyMessage={
        items.length
          ? 'Choose another source to see notes awaiting review.'
          : noteReviewPanel.emptyMessage
      }
      count={visible.length}
      headerAction={
        <ToggleButtonGroup
          exclusive
          value={source}
          aria-label="Filter notes awaiting review by source"
          size="small"
          sx={{
            flexWrap: 'wrap',
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              minHeight: 32,
              color: 'text.secondary',
              fontVariantNumeric: 'tabular-nums',
            },
          }}
          onChange={(
            _,
            value: DashboardPreferences['noteReviewSource'] | null
          ) => {
            if (value) onChange(value);
          }}
        >
          <ToggleButton value="all">
            <span className="ph-unmask">All notes</span>&nbsp;({items.length})
          </ToggleButton>
          <ToggleButton value="family">
            <span className="ph-unmask">Families</span>&nbsp;({familyCount})
          </ToggleButton>
          <ToggleButton value="referral">
            <span className="ph-unmask">Referrals</span>&nbsp;(
            {items.length - familyCount})
          </ToggleButton>
        </ToggleButtonGroup>
      }
    >
      {visible.map((item) => {
        const author =
          item.source === 'family'
            ? noteAuthor(item.note)
            : userLookup(item.note.authorId);
        const createdAt = item.createdAt;
        const hasDate = createdAt && Number.isFinite(createdAt.getTime());
        const familyId = item.familyId;
        const openFamily =
          familyId && familyLookup(familyId)
            ? () =>
                navigate.family(
                  familyId,
                  familyV2 ? { section: 'notes' } : undefined
                )
            : undefined;
        const onOpen =
          item.source === 'referral' &&
          referralsEnabled &&
          (familyV2 || !openFamily)
            ? () => navigate.referral(item.recordId)
            : openFamily;
        return (
          <DashboardQueueRow
            key={noteKey(item)}
            title={item.name}
            context={item.source === 'family' ? 'Family note' : 'Referral note'}
            onOpen={onOpen}
            actions={
              (item.source === 'family' || referralsEnabled) && (
                <>
                  {item.canDelete && (
                    <Button
                      className="ph-unmask"
                      size="small"
                      color="error"
                      startIcon={<DeleteForeverIcon />}
                      onClick={() => onAction(item, 'delete')}
                    >
                      Delete
                    </Button>
                  )}
                  {item.canEdit && (
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      className="ph-unmask"
                      onClick={() => onAction(item, 'edit')}
                    >
                      Edit
                    </Button>
                  )}
                  <Button
                    size="small"
                    startIcon={<CheckIcon />}
                    className="ph-unmask"
                    onClick={() => onAction(item, 'approve')}
                  >
                    Approve
                  </Button>
                </>
              )
            }
          >
            {item.preview && (
              <Typography
                component="span"
                variant="body2"
                sx={{ mt: 0.5, lineHeight: 1.5 }}
              >
                {item.preview}
              </Typography>
            )}
            {(author || hasDate) && (
              <Typography
                component="span"
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {author && personNameString(author)}
                {author && hasDate && ' · '}
                {hasDate && (
                  <time dateTime={createdAt.toISOString()}>
                    {format(createdAt, 'M/d/yy h:mm a')}
                  </time>
                )}
              </Typography>
            )}
          </DashboardQueueRow>
        );
      })}
    </DashboardRequirementPanel>
  );
}

function DashboardNoteDialog({
  item,
  action,
  familyV2,
  onClose,
}: {
  item: ReviewNote;
  action: RecentNoteActionKind;
  familyV2: boolean;
  onClose: () => void;
}) {
  if (item.source === 'family') {
    const Dialog = {
      edit: familyV2 ? AddEditNoteDrawer : AddEditNoteDialog,
      approve: ApproveNoteDialog,
      delete: DiscardNoteDialog,
    }[action];
    return (
      <Dialog familyId={item.recordId} note={item.note} onClose={onClose} />
    );
  }
  const Dialog = {
    edit: AddEditV1ReferralNoteDrawer,
    approve: ApproveV1ReferralNoteDialog,
    delete: DiscardV1ReferralNoteDialog,
  }[action];
  return (
    <Dialog referralId={item.recordId} note={item.note} onClose={onClose} />
  );
}

function DashboardSummary({
  counts,
  preferences,
}: {
  counts?: {
    pastDue: number;
    upcoming: number;
    notes: number;
    approvals: number;
  };
  preferences?: DashboardPreferences;
}) {
  const cards = [
    {
      label: 'Past due',
      icon: pastDuePanel.icon,
      count: counts?.pastDue,
      context:
        preferences?.pastDueDays === 'all'
          ? 'All past-due requirements'
          : preferences && `Last ${preferences.pastDueDays} days`,
      urgent: Boolean(counts?.pastDue),
    },
    {
      label: 'Upcoming',
      icon: upcomingPanel.icon,
      count: counts?.upcoming,
      context: preferences && `Next ${preferences.upcomingDays} days`,
    },
    {
      label: 'Awaiting review',
      icon: noteReviewPanel.icon,
      count: counts?.notes,
      context:
        preferences &&
        {
          all: 'All notes',
          family: 'Family notes',
          referral: 'Referral notes',
        }[preferences.noteReviewSource],
    },
    {
      label: 'Approvals & renewals',
      icon: expirationPanel.icon,
      count: counts?.approvals,
      context:
        preferences && `Next ${preferences.expirationDays} days + expired work`,
    },
  ];

  return (
    <Box
      component="ul"
      aria-label="Workload overview"
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(4, minmax(0, 1fr))',
        },
        listStyle: 'none',
        p: 0,
        m: 0,
        mb: 3,
        gap: { xs: 1.5, sm: 2 },
      }}
    >
      {cards.map(({ label, icon, count, context, urgent }) => (
        <Paper
          key={label}
          component="li"
          variant="outlined"
          sx={{
            minWidth: 0,
            p: { xs: 1.5, sm: 2 },
            borderRadius: 2,
            borderColor: 'divider',
            overflowWrap: 'anywhere',
          }}
        >
          <Stack spacing={0.5}>
            <Stack
              direction="row"
              spacing={0.75}
              sx={{
                alignItems: 'center',
                color: urgent ? 'error.dark' : 'primary.dark',
                '& .MuiSvgIcon-root': { flexShrink: 0 },
              }}
            >
              {icon}
              <Typography
                className="ph-unmask"
                variant="body2"
                sx={{ fontWeight: 500 }}
              >
                {label}
              </Typography>
            </Stack>
            <Typography
              component="div"
              sx={{ fontSize: 30, fontWeight: 600, lineHeight: 1.2 }}
              color={urgent ? 'error.dark' : 'text.primary'}
            >
              {count ?? <span aria-label="Loading">—</span>}
            </Typography>
            {count !== undefined && (
              <Typography variant="caption" color="text.secondary">
                {context}
              </Typography>
            )}
          </Stack>
        </Paper>
      ))}
    </Box>
  );
}

function DashboardColumns({
  upcoming,
  notes,
  pastDue,
  approvals,
}: {
  upcoming: ReactNode;
  notes: ReactNode;
  pastDue: ReactNode;
  approvals: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'minmax(0, 1fr)',
          lg: 'minmax(0, 3fr) minmax(0, 2fr)',
        },
        alignItems: { xs: 'start', lg: 'stretch' },
        gap: { xs: 2, lg: 2.5 },
      }}
    >
      {pastDue}
      {upcoming}
      {notes}
      {approvals}
    </Box>
  );
}

function DashboardRequirements({ storageKey }: { storageKey: string | null }) {
  const [noteSelection, setNoteSelection] = useState<{
    key: string;
    action: RecentNoteActionKind;
  }>();
  const referralsEnabled =
    useFeatureFlagEnabled(REFERRALS_FEATURE_FLAG) === true;
  const familyV2 =
    useFeatureFlagEnabled(FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG) === true;
  const [preferences, setPreferences] = useState(() =>
    readDashboardPreferences(storageKey)
  );
  const items = useArrangementWorkQueue();
  const location = useLocationConfiguration();
  const familyLookup = useFamilyLookup();
  const personLookup = usePersonAndFamilyLookup();
  const navigate = useAppNavigate();
  const today = locationCalendarDate(new Date(), location?.timeZone?.id);
  const { upcoming, pastDue, olderPastDueCount } = useMemo(
    () => selectDashboardRequirements(items, today, preferences),
    [items, today, preferences]
  );
  const evaluationTime = new Date();
  const approvals = useApprovalExpirationWorkQueue(
    evaluationTime.toISOString().slice(0, 10)
  );
  const renewals = useApprovalRenewalWorkQueue();
  const approvalWork = selectDashboardApprovalWork(
    approvals,
    renewals,
    evaluationTime,
    preferences.expirationDays
  );
  const notes = useDashboardNoteReview();
  const selectedNote =
    noteSelection &&
    notes.find(
      (item) =>
        noteKey(item) === noteSelection.key &&
        (item.source === 'family' || referralsEnabled) &&
        (noteSelection.action !== 'edit' || item.canEdit) &&
        (noteSelection.action !== 'delete' || item.canDelete)
    );
  const visibleNotes = filterDashboardNoteReview(
    notes,
    preferences.noteReviewSource
  );
  const counts = {
    upcoming: upcoming.reduce((sum, group) => sum + group.count, 0),
    pastDue: pastDue.reduce((sum, group) => sum + group.count, 0),
    notes: visibleNotes.length,
    approvals: Object.values(approvalWork).reduce(
      (sum, rows) => sum + rows.length,
      0
    ),
  };

  function updatePreferences(change: Partial<DashboardPreferences>) {
    const next = { ...preferences, ...change };
    setPreferences(next);
    writeDashboardPreferences(storageKey, next);
  }

  function rowContext({ target, assignment }: ArrangementWorkQueueItem) {
    const family = familyLookup(target.familyId);
    const cases = family?.partneringFamilyInfo;
    const v1Case =
      cases?.openV1Case?.id === target.v1CaseId
        ? cases.openV1Case
        : cases?.closedV1Cases?.find(({ id }) => id === target.v1CaseId);
    const arrangement = v1Case?.arrangements?.find(
      ({ id }) => id === target.arrangementId
    );
    const context = [
      disclosedFamilyName(family),
      arrangement?.arrangementType || 'Arrangement',
    ]
      .filter(Boolean)
      .join(' · ');
    if (!assignment) return { context };

    const volunteer = personLookup(assignment.personId).person;
    const assignee =
      volunteer && (volunteer.firstName?.trim() || volunteer.lastName?.trim())
        ? personNameString(volunteer)
        : disclosedFamilyName(familyLookup(assignment.volunteerFamilyId));

    return {
      context,
      assignment: [
        assignment.arrangementFunction,
        assignment.arrangementFunctionVariant,
        assignee,
      ]
        .filter(Boolean)
        .join(' · '),
    };
  }

  const [upcomingRequirements, pastDueRequirements] = [
    {
      ...upcomingPanel,
      emptyTitle: items.some(({ status }) => status === 'upcoming')
        ? upcomingPanel.emptyTitle
        : 'No upcoming work',
      emptyMessage: `No upcoming requirements in the next ${preferences.upcomingDays} days.`,
      groups: upcoming,
      count: counts.upcoming,
      footer: (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ px: 2, py: 1.25, mt: 'auto' }}
        >
          Some recurring requirements show only the next occurrence.
        </Typography>
      ),
      headerAction: (
        <NextDaysSelect
          label="Upcoming requirements time frame"
          value={preferences.upcomingDays}
          onChange={(upcomingDays) => updatePreferences({ upcomingDays })}
        />
      ),
    },
    {
      ...pastDuePanel,
      emptyTitle:
        olderPastDueCount > 0
          ? 'No overdue work in this window'
          : pastDuePanel.emptyTitle,
      emptyMessage:
        preferences.pastDueDays === 'all'
          ? pastDuePanel.emptyMessage
          : `No past-due requirements in the last ${preferences.pastDueDays} days.`,
      groups: pastDue,
      count: counts.pastDue,
      headerAction: (
        <Select
          size="small"
          value={preferences.pastDueDays}
          inputProps={{ 'aria-label': 'Past-due requirements time frame' }}
          sx={{ ml: { sm: 'auto' }, maxWidth: '100%' }}
          onChange={({ target: { value } }) => {
            if (value === 'all') {
              updatePreferences({ pastDueDays: 'all' });
              return;
            }
            const pastDueDays = requirementWindowDays.find(
              (days) => String(days) === String(value)
            );
            if (pastDueDays) updatePreferences({ pastDueDays });
          }}
        >
          <MenuItem value="all">All past due</MenuItem>
          {requirementWindowDays.map((days) => (
            <MenuItem key={days} value={days}>
              Last {days} days
            </MenuItem>
          ))}
        </Select>
      ),
      footer: olderPastDueCount > 0 && (
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ px: 2, pb: 1, alignItems: 'center', flexWrap: 'wrap' }}
        >
          <Typography variant="body2" color="text.secondary">
            {olderPastDueCount} older unresolved{' '}
            {olderPastDueCount === 1 ? 'requirement' : 'requirements'} outside
            this window.
          </Typography>
          <Button
            size="small"
            onClick={() => updatePreferences({ pastDueDays: 'all' })}
          >
            Show all
          </Button>
        </Stack>
      ),
    },
  ].map(({ groups, ...panel }) => (
    <DashboardRequirementPanel key={panel.title} {...panel}>
      {groups.map((group) => {
        return (
          <DashboardRequirementRow
            key={group.item.id}
            group={group}
            today={today}
            dateReached={
              group.item.status === 'upcoming' &&
              group.item.occurrenceDate <= today
            }
            {...rowContext(group.item)}
            onOpen={() =>
              openDashboardArrangement(navigate, group.item, familyV2)
            }
          />
        );
      })}
    </DashboardRequirementPanel>
  ));

  return (
    <>
      <DashboardSummary counts={counts} preferences={preferences} />
      <DashboardColumns
        upcoming={upcomingRequirements}
        pastDue={pastDueRequirements}
        approvals={
          <DashboardApprovalExpirations
            work={approvalWork}
            familyV2={familyV2}
            days={preferences.expirationDays}
            onChange={(expirationDays) => updatePreferences({ expirationDays })}
          />
        }
        notes={
          <DashboardNoteReview
            referralsEnabled={referralsEnabled}
            onAction={(item, action) =>
              setNoteSelection({ key: noteKey(item), action })
            }
            items={notes}
            visible={visibleNotes}
            familyV2={familyV2}
            source={preferences.noteReviewSource}
            onChange={(noteReviewSource) =>
              updatePreferences({ noteReviewSource })
            }
          />
        }
      />
      {selectedNote && noteSelection && (
        <DashboardNoteDialog
          item={selectedNote}
          action={noteSelection.action}
          familyV2={familyV2}
          onClose={() => setNoteSelection(undefined)}
        />
      )}
    </>
  );
}

export function Dashboard() {
  useScreenTitle('Dashboard');
  const storageKey = dashboardPreferencesKey(
    useAccountInfo()?.userId,
    useSelectedLocationContext()
  );

  return (
    <Container
      disableGutters
      maxWidth={false}
      sx={{ minWidth: 0, pt: 3, pb: 3 }}
    >
      <Stack component="header" spacing={0.5} sx={{ mb: 2.5 }}>
        <Typography
          className="ph-unmask"
          {...v2Typography.pageTitle}
          component="h1"
          sx={{
            fontWeight: 700,
            fontSize: { xs: 28, sm: 32 },
            lineHeight: 1.2,
          }}
        >
          Dashboard
        </Typography>
        <Typography
          className="ph-unmask"
          variant="body2"
          color="text.secondary"
        >
          Manage your priorities and stay on top of your responsibilities.
        </Typography>
      </Stack>
      <Suspense
        fallback={
          <>
            <DashboardSummary />
            <DashboardColumns
              upcoming={<DashboardRequirementPanel {...upcomingPanel} />}
              notes={<DashboardRequirementPanel {...noteReviewPanel} />}
              pastDue={<DashboardRequirementPanel {...pastDuePanel} />}
              approvals={<DashboardRequirementPanel {...expirationPanel} />}
            />
          </>
        }
      >
        <DashboardRequirements key={storageKey} storageKey={storageKey} />
      </Suspense>
    </Container>
  );
}
