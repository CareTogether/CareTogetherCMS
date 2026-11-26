import { useId, type ReactNode } from 'react';
import {
  Box,
  CardActions,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ChevronRight,
  InboxOutlined,
  ScheduleOutlined,
} from '@mui/icons-material';
import { formatUtcDateOnly } from '../Utilities/dateUtils';
import type { RequirementGroup } from './dashboardRequirements';

type DashboardRequirementPanelProps = {
  title: string;
  icon: ReactNode;
  emptyTitle: string;
  emptyMessage: string;
  count?: number;
  itemType?: 'requirement' | 'approval' | 'note';
  showCount?: boolean;
  loadingMessage?: string;
  headerAction?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
};

export function DashboardRequirementPanel({
  title,
  icon,
  emptyTitle,
  emptyMessage,
  count,
  itemType = 'requirement',
  showCount = true,
  loadingMessage = `Loading ${itemType}s…`,
  headerAction,
  footer,
  children,
}: DashboardRequirementPanelProps) {
  const headingId = useId();

  return (
    <Paper
      component="section"
      aria-labelledby={headingId}
      variant="outlined"
      elevation={0}
      sx={{
        minWidth: 0,
        overflow: 'hidden',
        borderRadius: 3,
        borderColor: 'divider',
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
          bgcolor: 'background.paper',
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
              color: 'primary.dark',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
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
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            {title}
          </Typography>
          {showCount && count !== undefined && (
            <Chip
              size="small"
              label={count}
              aria-label={`${count} ${itemType}${count === 1 ? '' : 's'}`}
              sx={{
                height: 22,
                fontWeight: 600,
                bgcolor: 'action.hover',
                flexShrink: 0,
              }}
            />
          )}
        </Stack>
        {headerAction}
      </Stack>
      {count === undefined ? (
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
          <InboxOutlined
            fontSize="small"
            color="action"
            aria-hidden
            sx={{ flexShrink: 0 }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              className="ph-unmask"
              variant="body2"
              sx={{ fontWeight: 600 }}
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
            borderTop: 1,
            borderColor: 'divider',
            maxHeight: { xs: 'min(72dvh, 36rem)', md: 400 },
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'thin',
            scrollbarColor: (theme) =>
              `${theme.palette.text.disabled} transparent`,
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
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

type DashboardRequirementRowProps = {
  dateReached: boolean;
  today: string;
  group: RequirementGroup;
  context: string;
  assignment?: string;
  onOpen: () => void;
};

export function DashboardRequirementRow({
  dateReached,
  today,
  group: { item, count },
  context,
  assignment,
  onOpen,
}: DashboardRequirementRowProps) {
  const pastDue = item.status === 'past-due';
  const daysFromToday =
    (Date.parse(item.occurrenceDate) - Date.parse(today)) / 86_400_000;
  const relativeDate =
    pastDue && daysFromToday < 0
      ? `${-daysFromToday} ${daysFromToday === -1 ? 'day' : 'days'} overdue`
      : !pastDue && daysFromToday > 0
        ? `Due in ${daysFromToday} ${daysFromToday === 1 ? 'day' : 'days'}`
        : undefined;

  return (
    <DashboardQueueRow
      title={item.requirementName}
      context={context}
      onOpen={onOpen}
    >
      {assignment && (
        <Typography component="span" variant="caption" color="text.secondary">
          {assignment}
        </Typography>
      )}
      <Stack
        component="span"
        direction="row"
        spacing={0.75}
        useFlexGap
        sx={{ flexWrap: 'wrap', alignItems: 'center', mt: 0.5 }}
      >
        <ScheduleOutlined
          aria-hidden
          sx={{ fontSize: 16, color: pastDue ? 'error.dark' : 'warning.dark' }}
        />
        <Typography
          component="span"
          variant="caption"
          className="ph-unmask"
          color={pastDue ? 'error.dark' : 'text.primary'}
          sx={{ fontWeight: 600 }}
        >
          {relativeDate ?? (pastDue ? 'Past due since' : 'Due')}
        </Typography>
        {relativeDate && (
          <Typography
            component="span"
            variant="caption"
            color="text.secondary"
            aria-hidden
          >
            ·
          </Typography>
        )}
        <Typography component="span" variant="caption" color="text.secondary">
          <time dateTime={item.occurrenceDate}>
            {formatUtcDateOnly(new Date(item.occurrenceDate))}
          </time>
        </Typography>
      </Stack>
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

export function DashboardQueueRow({
  title,
  context,
  onOpen,
  actions,
  children,
}: {
  title: string;
  context: string;
  onOpen?: () => void;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const content = (
    <Stack
      spacing={0.25}
      sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}
    >
      <Typography component="span" variant="body2" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <Typography component="span" variant="body2" color="text.secondary">
        {context}
      </Typography>
      {children}
    </Stack>
  );
  return (
    <ListItem
      disablePadding={!!onOpen}
      divider
      sx={
        actions ? { flexDirection: 'column', alignItems: 'stretch' } : undefined
      }
    >
      {onOpen ? (
        <ListItemButton
          component="button"
          type="button"
          onClick={onOpen}
          sx={{
            minWidth: 0,
            width: '100%',
            gap: 1,
            px: 2,
            py: actions ? 1.25 : 1.5,
            textAlign: 'left',
            '&:hover, &.Mui-focusVisible': { bgcolor: 'action.hover' },
            '&.Mui-focusVisible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: '-2px',
            },
          }}
        >
          {content}
          <ChevronRight
            fontSize="small"
            color="action"
            aria-hidden
            sx={{ flexShrink: 0 }}
          />
        </ListItemButton>
      ) : (
        content
      )}
      {actions && (
        <CardActions
          sx={{ paddingTop: 0, justifyContent: 'flex-end', flexWrap: 'wrap' }}
        >
          {actions}
        </CardActions>
      )}
    </ListItem>
  );
}
