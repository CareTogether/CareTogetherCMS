import {
  Check as CheckIcon,
  DeleteForever as DeleteForeverIcon,
  Edit as EditIcon,
  SnoozeOutlined,
} from '@mui/icons-material';
import {
  Button,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { personNameString } from '../Families/PersonName';
import type { RecentNoteActionKind } from '../Families/useRecentFamilyNoteActions';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import {
  useFamilyLookup,
  useNoteAuthorLookup,
  useUserLookup,
} from '../Model/DirectoryModel';
import { AddEditNoteDialog } from '../Notes/AddEditNoteDialog';
import { AddEditNoteDrawer } from '../Notes/AddEditNoteDrawer';
import { ApproveNoteDialog } from '../Notes/ApproveNoteDialog';
import { DiscardNoteDialog } from '../Notes/DiscardNoteDialog';
import { AddEditV1ReferralNoteDrawer } from '../V1Referrals/AddEditV1ReferralNoteDrawer';
import { ApproveV1ReferralNoteDialog } from '../V1Referrals/ApproveV1ReferralNoteDialog';
import { DiscardV1ReferralNoteDialog } from '../V1Referrals/DiscardV1ReferralNoteDialog';
import {
  DashboardQueueRow,
  DashboardRequirementPanel,
  DashboardSnoozedList,
} from './DashboardRequirementPanel';
import { filterDashboardNoteReview } from './dashboardNoteReview';
import { type DashboardPreferences } from './dashboardPreferences';
import { noteSnoozeToken } from './dashboardSnoozes';

import { noteReviewPanel } from './dashboardPanels';
import {
  noteKey,
  useDashboardNoteReview,
  type ReviewNote,
} from './useDashboardNoteReview';

export function DashboardNoteReview({
  familyV2,
  referralsEnabled,
  source,
  onChange,
  items,
  visible,
  onAction,
  snoozed,
  onSnooze,
  onUnsnooze,
  hasNotes,
  focusSnoozed,
  onSnoozedFocused,
}: {
  familyV2: boolean;
  referralsEnabled: boolean;
  source: DashboardPreferences['noteReviewSource'];
  onChange: (source: DashboardPreferences['noteReviewSource']) => void;
  items: ReturnType<typeof useDashboardNoteReview>;
  visible: ReturnType<typeof filterDashboardNoteReview>;
  onAction: (item: ReviewNote, action: RecentNoteActionKind) => void;
  snoozed: { item: ReviewNote; token: string; wakeAt: number }[];
  onSnooze: ((token: string) => void) | undefined;
  onUnsnooze: (token: string) => void;
  hasNotes: boolean;
  focusSnoozed: boolean;
  onSnoozedFocused: () => void;
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
        snoozed.length
          ? 'No active notes in this view'
          : hasNotes
            ? 'No notes for this source'
            : noteReviewPanel.emptyTitle
      }
      emptyMessage={
        snoozed.length
          ? 'Snoozed notes are listed below.'
          : hasNotes
            ? 'Choose another source to see notes awaiting review.'
            : noteReviewPanel.emptyMessage
      }
      count={visible.length}
      footer={
        <DashboardSnoozedList
          focusToggle={focusSnoozed}
          onToggleFocused={onSnoozedFocused}
          items={snoozed.map(({ item, token, wakeAt }) => ({
            key: token,
            title: item.name,
            details: (
              <Typography variant="body2" color="text.secondary">
                {item.preview}
              </Typography>
            ),
            wakeAt,
            restoreLabel: 'Unsnooze note',
            onRestore: () => onUnsnooze(token),
          }))}
        />
      }
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
        const snoozeToken =
          onSnooze && (item.source === 'family' || referralsEnabled)
            ? noteSnoozeToken(item)
            : null;
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
                  {snoozeToken && (
                    <Tooltip title="Snooze note">
                      <IconButton
                        size="small"
                        aria-label="Snooze note"
                        onClick={() => onSnooze?.(snoozeToken)}
                      >
                        <SnoozeOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
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

export function DashboardNoteDialog({
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
