import { EventAvailableOutlined, EventBusyOutlined } from '@mui/icons-material';
import {
  Button,
  Container,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useAccountInfo } from '../Authentication/Auth';
import { personNameString } from '../Families/PersonName';
import type { RecentNoteActionKind } from '../Families/useRecentFamilyNoteActions';
import { v2Typography } from '../Families/v2Typography';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { useLocationConfiguration } from '../Model/ConfigurationModel';
import { useSelectedLocationContext } from '../Model/Data';
import {
  useFamilyLookup,
  usePersonAndFamilyLookup,
} from '../Model/DirectoryModel';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { formatUtcDateOnly } from '../Utilities/dateUtils';
import {
  FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG,
  REFERRALS_FEATURE_FLAG,
} from '../featureFlags';
import {
  DashboardRequirementPanel,
  DashboardRequirementRow,
  DashboardSnoozedList,
} from './DashboardRequirementPanel';
import { DashboardSnoozeDrawer } from './DashboardSnoozeDrawer';
import type { ArrangementWorkQueueItem } from './arrangementWorkQueue';
import { filterDashboardNoteReview } from './dashboardNoteReview';
import {
  dashboardPreferencesKey,
  readDashboardPreferences,
  requirementWindowDays,
  writeDashboardPreferences,
  type DashboardPreferences,
} from './dashboardPreferences';
import {
  locationCalendarDate,
  requirementGroupKey,
  selectDashboardRequirements,
} from './dashboardRequirements';
import {
  noteSnoozeToken,
  partitionSnoozed,
  removeSnooze,
  snoozeStoragePrefix,
  writeSnooze,
  type SnoozeScope,
} from './dashboardSnoozes';
import { openDashboardArrangement } from './dashboardWorkNavigation';
import { useArrangementWorkQueue } from './useArrangementWorkQueue';

import {
  DashboardNoteDialog,
  DashboardNoteReview,
} from './DashboardNoteReviewSection';
import { disclosedFamilyName } from './dashboardFamilyName';
import {
  DashboardColumns,
  NextDaysSelect,
  type SnoozeKind,
} from './dashboardLayout';
import { noteReviewPanel } from './dashboardPanels';
import { noteKey, useDashboardNoteReview } from './useDashboardNoteReview';

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

function DashboardRequirements({ storageKey }: { storageKey: string | null }) {
  const userId = useAccountInfo()?.userId;
  const locationScope = useSelectedLocationContext();
  const snoozeScope =
    userId && locationScope
      ? ({ ...locationScope, userId } satisfies SnoozeScope)
      : null;
  const scopePrefix = snoozeScope && snoozeStoragePrefix(snoozeScope);
  const [snoozeSelection, setSnoozeSelection] = useState<{
    token: string;
    kind: SnoozeKind;
  }>();
  const [focusSnoozed, setFocusSnoozed] = useState<SnoozeKind>();
  const clearSnoozedFocus = useCallback(() => setFocusSnoozed(undefined), []);
  const [snoozeFeedback, setSnoozeFeedback] = useState('');
  const [, setSnoozeRevision] = useState(0);
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
  const evaluationTime = new Date();
  const requirementSnoozes = partitionSnoozed(
    items,
    ({ snoozeToken }) => snoozeToken,
    snoozeScope,
    evaluationTime.getTime()
  );
  const { upcoming, pastDue, olderPastDueCount } = selectDashboardRequirements(
    requirementSnoozes.active,
    today,
    preferences
  );
  const snoozedRequirements = selectDashboardRequirements(
    requirementSnoozes.snoozed.map(({ item }) => item),
    today,
    preferences
  );
  const requirementWakeAt = new Map(
    requirementSnoozes.snoozed.map(({ token, wakeAt }) => [token, wakeAt])
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
  const {
    active: activeNotes,
    snoozed: snoozedNotes,
    nextWake: nextNoteWake,
  } = partitionSnoozed(
    notes,
    (item) =>
      item.source === 'family' || referralsEnabled
        ? noteSnoozeToken(item)
        : null,
    snoozeScope,
    evaluationTime.getTime()
  );
  const wakeTimes = [nextNoteWake, requirementSnoozes.nextWake].filter(
    (wake) => wake !== undefined
  );
  const nextWake = wakeTimes.length ? Math.min(...wakeTimes) : undefined;
  const visibleNotes = filterDashboardNoteReview(
    activeNotes,
    preferences.noteReviewSource
  );
  const visibleSnoozed = snoozedNotes.filter(
    ({ item }) =>
      preferences.noteReviewSource === 'all' ||
      item.source === preferences.noteReviewSource
  );
  const selectedSnooze =
    snoozeSelection &&
    snoozeScope &&
    (snoozeSelection.kind === 'note'
      ? visibleNotes.some(
          (item) =>
            (item.source === 'family' || referralsEnabled) &&
            noteSnoozeToken(item) === snoozeSelection.token
        )
      : (snoozeSelection.kind === 'upcoming' ? upcoming : pastDue).some(
          ({ item }) => item.snoozeToken === snoozeSelection.token
        ));

  function restoreSnooze(token: string, message: string) {
    const saved = removeSnooze(snoozeScope, token);
    setSnoozeRevision((revision) => revision + 1);
    setSnoozeFeedback(saved ? message : 'Could not remove the snooze.');
  }

  useEffect(() => {
    if (!scopePrefix) return;
    const refresh = () => setSnoozeRevision((revision) => revision + 1);
    const storageChanged = (event: StorageEvent) => {
      if (!event.key || event.key.startsWith(scopePrefix)) refresh();
    };
    let timer: number | undefined;
    function schedule(wake: number) {
      const remaining = wake - Date.now();
      if (remaining <= 0) {
        refresh();
      } else {
        timer = window.setTimeout(
          () => schedule(wake),
          Math.min(remaining, 2_147_483_647)
        );
      }
    }
    if (nextWake !== undefined) schedule(nextWake);
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    window.addEventListener('storage', storageChanged);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pageshow', refresh);
      window.removeEventListener('storage', storageChanged);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [scopePrefix, nextWake]);
  const counts = {
    upcoming: upcoming.reduce((sum, group) => sum + group.count, 0),
    pastDue: pastDue.reduce((sum, group) => sum + group.count, 0),
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

  function snoozedRequirementList(kind: 'upcoming' | 'pastDue') {
    return (
      <DashboardSnoozedList
        focusToggle={focusSnoozed === kind}
        onToggleFocused={clearSnoozedFocus}
        items={snoozedRequirements[kind].flatMap(({ item }) => {
          const wakeAt =
            item.snoozeToken && requirementWakeAt.get(item.snoozeToken);
          if (!item.snoozeToken || !wakeAt) return [];
          const token = item.snoozeToken;
          return [
            {
              key: token,
              title: item.requirementName,
              details: (
                <Typography variant="body2" color="text.secondary">
                  {rowContext(item).context} ·{' '}
                  <span className="ph-unmask">
                    {item.status === 'past-due' ? 'Past due since' : 'Due'}
                  </span>{' '}
                  <time dateTime={item.occurrenceDate}>
                    {formatUtcDateOnly(new Date(item.occurrenceDate))}
                  </time>
                </Typography>
              ),
              wakeAt,
              restoreLabel: `Unsnooze ${item.requirementName}`,
              onRestore: () =>
                restoreSnooze(token, 'Requirement returned to the dashboard.'),
            },
          ];
        })}
      />
    );
  }

  const [upcomingRequirements, pastDueRequirements] = [
    {
      ...upcomingPanel,
      kind: 'upcoming' as const,
      emptyTitle: snoozedRequirements.upcoming.length
        ? 'No active requirements in this view'
        : items.some(({ status }) => status === 'upcoming')
          ? upcomingPanel.emptyTitle
          : 'No upcoming work',
      emptyMessage: snoozedRequirements.upcoming.length
        ? 'Snoozed requirements are listed below.'
        : `No upcoming requirements in the next ${preferences.upcomingDays} days.`,
      groups: upcoming,
      count: counts.upcoming,
      footer: (
        <>
          {snoozedRequirementList('upcoming')}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ px: 2, py: 1.25, mt: 'auto' }}
          >
            Some recurring requirements show only the next occurrence.
          </Typography>
        </>
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
      kind: 'pastDue' as const,
      emptyTitle: snoozedRequirements.pastDue.length
        ? 'No active requirements in this view'
        : olderPastDueCount > 0
          ? 'No overdue work in this window'
          : pastDuePanel.emptyTitle,
      emptyMessage: snoozedRequirements.pastDue.length
        ? 'Snoozed requirements are listed below.'
        : preferences.pastDueDays === 'all'
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
      footer: (
        <>
          {snoozedRequirementList('pastDue')}
          {olderPastDueCount > 0 && (
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{ px: 2, pb: 1, alignItems: 'center', flexWrap: 'wrap' }}
            >
              <Typography variant="body2" color="text.secondary">
                {olderPastDueCount} older unresolved{' '}
                {olderPastDueCount === 1 ? 'requirement' : 'requirements'}{' '}
                outside this window.
              </Typography>
              <Button
                size="small"
                onClick={() => updatePreferences({ pastDueDays: 'all' })}
              >
                Show all
              </Button>
            </Stack>
          )}
        </>
      ),
    },
  ].map(({ groups, kind, ...panel }) => (
    <DashboardRequirementPanel key={panel.title} {...panel}>
      {groups.map((group) => {
        const token = group.item.snoozeToken;
        return (
          <DashboardRequirementRow
            key={requirementGroupKey(group.item)}
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
            onSnooze={
              snoozeScope && token
                ? () => setSnoozeSelection({ token, kind })
                : undefined
            }
          />
        );
      })}
    </DashboardRequirementPanel>
  ));

  return (
    <>
      <DashboardColumns
        upcoming={upcomingRequirements}
        pastDue={pastDueRequirements}
        approvals={null}
        notes={
          <DashboardNoteReview
            referralsEnabled={referralsEnabled}
            onAction={(item, action) =>
              setNoteSelection({ key: noteKey(item), action })
            }
            items={activeNotes}
            hasNotes={notes.length > 0}
            visible={visibleNotes}
            snoozed={visibleSnoozed}
            onSnooze={
              snoozeScope
                ? (token) => setSnoozeSelection({ token, kind: 'note' })
                : undefined
            }
            onUnsnooze={(token) =>
              restoreSnooze(token, 'Note returned to the review queue.')
            }
            focusSnoozed={focusSnoozed === 'note'}
            onSnoozedFocused={clearSnoozedFocus}
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
      {selectedSnooze && (
        <DashboardSnoozeDrawer
          onClose={() => setSnoozeSelection(undefined)}
          onSnooze={(wakeAt, now) => {
            const saved = writeSnooze(
              snoozeScope,
              snoozeSelection.token,
              wakeAt,
              now
            );
            setSnoozeRevision((revision) => revision + 1);
            setSnoozeFeedback(
              saved
                ? snoozeSelection.kind === 'note'
                  ? 'Note snoozed.'
                  : 'Requirement snoozed.'
                : 'Could not save the snooze on this device.'
            );
            if (saved) setFocusSnoozed(snoozeSelection.kind);
            setSnoozeSelection(undefined);
          }}
        />
      )}
      {!selectedSnooze && (
        <Snackbar
          open={Boolean(snoozeFeedback)}
          autoHideDuration={5000}
          onClose={() => setSnoozeFeedback('')}
          message={snoozeFeedback}
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
            <DashboardColumns
              upcoming={<DashboardRequirementPanel {...upcomingPanel} />}
              notes={<DashboardRequirementPanel {...noteReviewPanel} />}
              pastDue={<DashboardRequirementPanel {...pastDuePanel} />}
              approvals={null}
            />
          </>
        }
      >
        <DashboardRequirements key={storageKey} storageKey={storageKey} />
      </Suspense>
    </Container>
  );
}
