import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import {
  Box,
  Button,
  CardActions,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, darken, type Theme } from '@mui/material/styles';
import {
  ErrorOutlineOutlined,
  InboxOutlined,
  ScheduleOutlined,
  SnoozeOutlined,
} from '@mui/icons-material';
import { formatUtcDateOnly } from '../Utilities/dateUtils';
import {
  requirementDeadline,
  type RequirementDeadlineUrgency,
  type RequirementGroup,
} from './dashboardRequirements';

type DashboardRequirementPanelProps = {
  title: string;
  icon: ReactNode;
  emptyTitle: string;
  emptyMessage: string;
  emptyIcon?: ReactNode;
  count?: number;
  itemType?:
    | 'requirement'
    | 'approval work item'
    | 'note'
    | 'assignment'
    | 'record';
  emphasis?: 'error';
  loadingMessage?: string;
  errorMessage?: string;
  headerAction?: ReactNode;
  footer?: ReactNode;
  compact?: boolean;
  children?: ReactNode;
};

export function DashboardRequirementPanel({
  title,
  icon,
  emptyTitle,
  emptyMessage,
  emptyIcon = <InboxOutlined fontSize="small" color="action" />,
  count,
  itemType = 'requirement',
  emphasis,
  loadingMessage = `Loading ${itemType}s…`,
  headerAction,
  footer,
  errorMessage,
  compact = false,
  children,
}: DashboardRequirementPanelProps) {
  const headingId = useId();
  const urgent = emphasis === 'error' && Boolean(count);

  return (
    <Paper
      component="section"
      aria-labelledby={headingId}
      variant="outlined"
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflow: 'hidden',
        borderRadius: 2,
        borderColor: 'divider',
        containerType: 'inline-size',
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{
          p: 2,
          alignItems: 'center',
          flexWrap: 'wrap',
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.035),
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Stack
          direction="row"
          spacing={1.25}
          sx={{ alignItems: 'center', minWidth: 0, flex: '1 1 auto' }}
        >
          <Box
            aria-hidden
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 34,
              height: 34,
              flexShrink: 0,
              borderRadius: 1.5,
              color: urgent ? 'error.dark' : 'primary.dark',
              bgcolor: (theme) =>
                alpha(
                  urgent
                    ? theme.palette.error.main
                    : theme.palette.primary.main,
                  0.08
                ),
            }}
          >
            {icon}
          </Box>
          <Typography
            id={headingId}
            className="ph-unmask"
            component="h2"
            variant="subtitle1"
            sx={{
              minWidth: 0,
              overflowWrap: 'anywhere',
              fontWeight: 600,
              lineHeight: 1.3,
            }}
          >
            {title}
          </Typography>
          {count !== undefined && (
            <Chip
              size="small"
              label={count}
              aria-label={`${count} ${itemType}${count === 1 ? '' : 's'}`}
              sx={{
                height: 24,
                minWidth: 28,
                fontSize: '0.8125rem',
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
                color: urgent
                  ? 'error.dark'
                  : count
                    ? 'primary.dark'
                    : undefined,
                bgcolor: (theme) =>
                  count
                    ? alpha(
                        urgent
                          ? theme.palette.error.main
                          : theme.palette.primary.main,
                        0.12
                      )
                    : theme.palette.action.hover,
                flexShrink: 0,
              }}
            />
          )}
        </Stack>
        {headerAction}
      </Stack>
      {errorMessage ? (
        <Typography role="status" color="text.secondary" sx={{ p: 2 }}>
          {errorMessage}
        </Typography>
      ) : count === undefined ? (
        <Stack
          direction="row"
          spacing={1}
          role="status"
          sx={{ px: 2, pb: 2, alignItems: 'center' }}
        >
          <CircularProgress size={16} aria-hidden />
          <Typography className="ph-unmask" variant="body2">
            {loadingMessage}
          </Typography>
        </Stack>
      ) : count === 0 ? (
        <Stack
          direction="row"
          spacing={1.25}
          sx={{
            mx: 2,
            mb: 2,
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'action.hover',
          }}
        >
          <Box aria-hidden sx={{ display: 'flex', flexShrink: 0 }}>
            {emptyIcon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              className="ph-unmask"
              variant="body2"
              sx={{ fontWeight: 500 }}
            >
              {emptyTitle}
            </Typography>
            <Typography
              className="ph-unmask"
              variant="caption"
              color="text.secondary"
            >
              {emptyMessage}
            </Typography>
          </Box>
        </Stack>
      ) : (
        <Box
          role="group"
          aria-labelledby={headingId}
          tabIndex={0}
          sx={{
            maxHeight: compact
              ? { xs: 'min(50dvh, 20rem)', lg: '15rem' }
              : { xs: 'min(65dvh, 36rem)', lg: 'min(42dvh, 18rem)' },
            overflowY: 'auto',
            overflowX: 'hidden',
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.dark',
              outlineOffset: '-2px',
            },
          }}
        >
          <List disablePadding>{children}</List>
        </Box>
      )}
      {footer}
    </Paper>
  );
}

// Each urgency level gets a distinct icon so it never relies on color alone
// (WCAG 1.4.1). Text colors are the dark palette variants, which keep 4.5:1
// contrast on the paper background.
const deadlinePresentation: Record<
  RequirementDeadlineUrgency,
  {
    Icon?: typeof ErrorOutlineOutlined;
    color: string | ((theme: Theme) => string);
  }
> = {
  overdue: { Icon: ErrorOutlineOutlined, color: 'error.dark' },
  soon: {
    Icon: ScheduleOutlined,
    color: (theme) => darken(theme.palette.warning.dark, 0.2),
  },
  normal: { color: 'text.primary' },
};

type DashboardRequirementRowProps = {
  dateReached: boolean;
  today: string;
  group: RequirementGroup;
  context: string;
  assignment?: string;
  onOpen: () => void;
  onSnooze?: () => void;
};

export function DashboardRequirementRow({
  dateReached,
  today,
  group: { item, count },
  context,
  assignment,
  onOpen,
  onSnooze,
}: DashboardRequirementRowProps) {
  const { label, urgency } = requirementDeadline(item, today);
  const { Icon, color } = deadlinePresentation[urgency];

  return (
    <DashboardQueueRow
      title={item.requirementName}
      context={context}
      onOpen={onOpen}
      trailingAction={
        onSnooze && (
          <Tooltip title="Snooze requirement">
            <IconButton
              size="small"
              aria-label={`Snooze ${item.requirementName}`}
              onClick={onSnooze}
            >
              <SnoozeOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        )
      }
      deadline={
        <>
          <Typography
            component="span"
            variant="body2"
            className="ph-unmask"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              fontWeight: 500,
              color,
            }}
          >
            {Icon && (
              <Icon aria-hidden sx={{ fontSize: '1rem', flexShrink: 0 }} />
            )}
            {label}
          </Typography>
          <Typography component="span" variant="caption" color="text.secondary">
            <time dateTime={item.occurrenceDate}>
              {formatUtcDateOnly(new Date(item.occurrenceDate))}
            </time>
          </Typography>
        </>
      }
    >
      {assignment && (
        <Typography component="span" variant="caption" color="text.secondary">
          {assignment}
        </Typography>
      )}
      {dateReached && (
        <Typography
          component="span"
          variant="caption"
          color="text.secondary"
          className="ph-unmask"
        >
          Due date reached. Status pending a Records update.
        </Typography>
      )}
      {count > 1 && (
        <Typography
          className="ph-unmask"
          component="span"
          variant="caption"
          color="text.secondary"
        >
          {count} matching requirements
        </Typography>
      )}
    </DashboardQueueRow>
  );
}

function TruncatedText({ children }: { children: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const isTruncated = () =>
    !!ref.current && ref.current.scrollWidth > ref.current.clientWidth;
  return (
    // Tooltip text renders in a masked popper; a `title` attribute would not
    // be masked in session recordings.
    <Tooltip
      title={children}
      describeChild
      open={open}
      onOpen={() => setOpen(isTruncated())}
      onClose={() => setOpen(false)}
      disableFocusListener
      disableTouchListener
    >
      <Typography
        ref={ref}
        component="span"
        variant="body2"
        color="text.secondary"
        noWrap
      >
        {children}
      </Typography>
    </Tooltip>
  );
}

export function DashboardQueueRow({
  title,
  context,
  onOpen,
  actions,
  trailingAction,
  deadline,
  children,
}: {
  title: string;
  context: string;
  onOpen?: () => void;
  actions?: ReactNode;
  trailingAction?: ReactNode;
  deadline?: ReactNode;
  children: ReactNode;
}) {
  const content = (
    <Stack
      component="span"
      spacing={0.25}
      sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere', gridArea: 'main' }}
    >
      <Typography
        component="span"
        variant="body2"
        sx={{ fontSize: 15, fontWeight: 500 }}
      >
        {title}
      </Typography>
      <TruncatedText>{context}</TruncatedText>
      {children}
    </Stack>
  );
  return (
    <ListItem
      disablePadding={!!onOpen}
      divider
      sx={{
        ...(actions && { flexDirection: 'column', alignItems: 'stretch' }),
        // Highlight at the item level so hovering or focusing the trailing
        // action keeps the whole row highlighted.
        ...(onOpen && {
          '&:hover, &:has(.Mui-focusVisible)': { bgcolor: 'action.hover' },
        }),
      }}
    >
      {onOpen ? (
        <ListItemButton
          component="button"
          type="button"
          onClick={onOpen}
          sx={{
            minWidth: 0,
            width: '100%',
            ...(trailingAction && { width: 'auto', flex: '1 1 auto' }),
            gap: 1,
            px: 2,
            py: actions ? 1.25 : 1.5,
            textAlign: 'left',
            ...(deadline && {
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr)',
              gridTemplateAreas: '"main" "deadline"',
              rowGap: 0.5,
              '@container (min-width: 28rem)': {
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, auto)',
                gridTemplateAreas: '"main deadline"',
              },
            }),
            // The ListItem owns the highlight; avoid stacking a second one.
            '&:hover, &.Mui-focusVisible': { bgcolor: 'transparent' },
            '&.Mui-focusVisible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: '-2px',
            },
          }}
        >
          {content}
          {deadline && (
            <Stack
              component="span"
              sx={{
                flexShrink: 0,
                minWidth: 0,
                overflowWrap: 'anywhere',
                alignItems: 'flex-start',
                fontVariantNumeric: 'tabular-nums',
                gridArea: 'deadline',
                '@container (min-width: 28rem)': { alignItems: 'flex-end' },
              }}
            >
              {deadline}
            </Stack>
          )}
        </ListItemButton>
      ) : (
        content
      )}
      {trailingAction && (
        // A sibling of the row button (never nested in it), so clicks don't
        // open the row and Tab order is row → action.
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            alignSelf: 'center',
            flexShrink: 0,
            pr: 2,
            '& .Mui-focusVisible': {
              outline: '2px solid',
              outlineColor: 'primary.dark',
            },
          }}
        >
          {trailingAction}
        </Box>
      )}
      {actions && (
        <CardActions
          sx={{
            px: 2,
            pt: 0,
            pb: 1.25,
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
            gap: 1,
            '& .MuiButton-root': { minHeight: 32 },
            '& .Mui-focusVisible': {
              outline: '2px solid',
              outlineColor: 'primary.dark',
              outlineOffset: '2px',
            },
          }}
          disableSpacing
        >
          {actions}
        </CardActions>
      )}
    </ListItem>
  );
}

export type DashboardSnoozedItem = {
  key: string;
  title: string;
  details: ReactNode;
  wakeAt: number;
  restoreLabel: string;
  onRestore: () => void;
};

export function DashboardSnoozedList({
  items,
  focusToggle,
  onToggleFocused,
}: {
  items: DashboardSnoozedItem[];
  focusToggle?: boolean;
  onToggleFocused?: () => void;
}) {
  const [showSnoozed, setShowSnoozed] = useState(false);
  const snoozedListId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!focusToggle || !toggleRef.current) return;
    toggleRef.current.focus();
    onToggleFocused?.();
  }, [focusToggle, onToggleFocused, items.length]);

  if (!items.length) return null;

  return (
    <Box sx={{ px: 2, py: 1 }}>
      <Button
        ref={toggleRef}
        size="small"
        aria-expanded={showSnoozed}
        aria-controls={snoozedListId}
        onClick={() => setShowSnoozed((show) => !show)}
      >
        <span className="ph-unmask">
          {showSnoozed ? 'Hide snoozed' : 'Show snoozed'} ({items.length})
        </span>
      </Button>
      <Collapse id={snoozedListId} in={showSnoozed} unmountOnExit>
        <List
          dense
          disablePadding
          sx={{ maxHeight: 'min(36dvh, 18rem)', overflowY: 'auto' }}
        >
          {items.map(
            ({ key, title, details, wakeAt, restoreLabel, onRestore }) => (
              <ListItem
                key={key}
                divider
                sx={{ px: 0, flexWrap: 'wrap', gap: 1 }}
              >
                <Box
                  sx={{
                    flex: '1 1 12rem',
                    minWidth: 0,
                    overflowWrap: 'anywhere',
                  }}
                >
                  <Typography variant="body2">{title}</Typography>
                  {details}
                  <Typography variant="caption" color="text.secondary">
                    <span className="ph-unmask">Returns</span>{' '}
                    <time dateTime={new Date(wakeAt).toISOString()}>
                      {new Date(wakeAt).toLocaleString()}
                    </time>
                  </Typography>
                </Box>
                <Button
                  size="small"
                  aria-label={restoreLabel}
                  onClick={onRestore}
                >
                  <span className="ph-unmask">Unsnooze</span>
                </Button>
              </ListItem>
            )
          )}
        </List>
      </Collapse>
    </Box>
  );
}
