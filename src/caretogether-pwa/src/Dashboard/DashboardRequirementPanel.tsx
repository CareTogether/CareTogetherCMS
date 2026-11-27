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
import { alpha, darken } from '@mui/material/styles';
import { ChevronRight, InboxOutlined } from '@mui/icons-material';
import { formatUtcDateOnly } from '../Utilities/dateUtils';
import type { RequirementGroup } from './dashboardRequirements';

type DashboardRequirementPanelProps = {
  title: string;
  icon: ReactNode;
  emptyTitle: string;
  emptyMessage: string;
  emptyIcon?: ReactNode;
  count?: number;
  itemType?: 'requirement' | 'approval work item' | 'note';
  emphasis?: 'error';
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
  emptyIcon = <InboxOutlined fontSize="small" color="action" />,
  count,
  itemType = 'requirement',
  emphasis,
  loadingMessage = `Loading ${itemType}s…`,
  headerAction,
  footer,
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
                height: 22,
                fontWeight: 500,
                fontVariantNumeric: 'tabular-nums',
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
            maxHeight: { xs: 'min(65dvh, 36rem)', lg: 'min(42dvh, 18rem)' },
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
  const deadlineColor = pastDue
    ? 'error.dark'
    : daysFromToday >= 0 && daysFromToday <= 3
      ? undefined
      : 'text.primary';

  return (
    <DashboardQueueRow
      title={item.requirementName}
      context={context}
      onOpen={onOpen}
      deadline={
        <>
          <Typography
            component="span"
            variant="body2"
            className="ph-unmask"
            sx={{
              fontWeight: 500,
              color: (theme) =>
                deadlineColor ?? darken(theme.palette.warning.dark, 0.2),
            }}
          >
            {relativeDate ??
              (pastDue
                ? 'Past due since'
                : daysFromToday === 0
                  ? 'Due today'
                  : 'Due')}
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

export function DashboardQueueRow({
  title,
  context,
  onOpen,
  actions,
  deadline,
  children,
}: {
  title: string;
  context: string;
  onOpen?: () => void;
  actions?: ReactNode;
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
            ...(deadline && {
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gridTemplateAreas: '"main arrow" "deadline arrow"',
              rowGap: 0.5,
              '@container (min-width: 28rem)': {
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, auto) auto',
                gridTemplateAreas: '"main deadline arrow"',
              },
            }),
            '&:hover, &.Mui-focusVisible': { bgcolor: 'action.hover' },
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
          <ChevronRight
            fontSize="small"
            color="action"
            aria-hidden
            sx={{ flexShrink: 0, gridArea: 'arrow' }}
          />
        </ListItemButton>
      ) : (
        content
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
