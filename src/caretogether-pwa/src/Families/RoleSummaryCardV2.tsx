import {
  Box,
  Card,
  CardActionArea,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { alpha, Theme } from '@mui/material/styles';
import { format } from 'date-fns';
import { RoleApprovalStatus } from '../GeneratedClient';
import type {
  RemovedRoleSummary,
  RoleSummaryCard,
} from './roleSummaryViewModel';

type RoleSummaryCardV2Props = {
  card: RoleSummaryCard | RemovedRoleSummary;
  onClick?: () => void;
};

function statusColor(status: RoleApprovalStatus) {
  switch (status) {
    case RoleApprovalStatus.Prospective:
      return 'secondary';
    case RoleApprovalStatus.Approved:
      return 'success';
    case RoleApprovalStatus.Onboarded:
      return 'primary';
    default:
      return 'default';
  }
}

function statusSx(status: RoleApprovalStatus) {
  return (theme: Theme) => {
    const color = statusColor(status);

    if (color === 'default') {
      return {
        backgroundColor: theme.palette.action.hover,
        borderColor: theme.palette.divider,
      };
    }

    return {
      backgroundColor: alpha(theme.palette[color].main, 0.06),
      borderColor: alpha(theme.palette[color].main, 0.28),
    };
  };
}

function isRemovedRoleSummary(
  card: RoleSummaryCard | RemovedRoleSummary
): card is RemovedRoleSummary {
  return !('status' in card);
}

function statusLabel(card: RoleSummaryCard) {
  const label = RoleApprovalStatus[card.status];

  return card.effectiveDate
    ? `${label} • ${format(card.effectiveDate, 'MMM d, yyyy')}`
    : label;
}

function removedStatusLabel(card: RemovedRoleSummary) {
  return card.roleRemoval.effectiveSince
    ? `Removed • ${format(card.roleRemoval.effectiveSince, 'MMM d, yyyy')}`
    : 'Removed';
}

export function RoleSummaryCardV2({ card, onClick }: RoleSummaryCardV2Props) {
  const removed = isRemovedRoleSummary(card);
  const content = (
    <Stack spacing={1}>
      <Stack spacing={0.25}>
        <Typography
          className="ph-unmask"
          color="text.secondary"
          variant="caption"
        >
          {card.subject.label}
        </Typography>
        <Typography
          className="ph-unmask"
          color={removed ? 'text.secondary' : 'text.primary'}
          variant="body2"
          sx={{ fontWeight: 600 }}
        >
          {card.roleName}
        </Typography>
        <Typography color="text.secondary" variant="caption">
          {removed ? removedStatusLabel(card) : statusLabel(card)}
        </Typography>
      </Stack>

      {removed ? (
        <Box
          sx={{
            height: 5,
            borderRadius: 999,
            bgcolor: 'action.disabledBackground',
          }}
        />
      ) : (
        <LinearProgress
          aria-label={`${card.completionPercentage}% complete`}
          variant="determinate"
          value={card.completionPercentage}
          sx={{ height: 5, borderRadius: 999 }}
        />
      )}
    </Stack>
  );

  return (
    <Card
      variant="outlined"
      sx={[
        {
          width: 240,
          flex: '0 0 auto',
          transition: (theme) =>
            theme.transitions.create(['box-shadow', 'transform'], {
              duration: theme.transitions.duration.shortest,
            }),
        },
        removed
          ? {
              bgcolor: 'action.hover',
              borderColor: 'divider',
            }
          : statusSx(card.status),
        onClick
          ? {
              '&:hover': {
                boxShadow: 2,
                transform: 'translateY(-1px)',
              },
              '&:focus-within': {
                boxShadow: 2,
              },
            }
          : {},
      ]}
    >
      {onClick ? (
        <CardActionArea
          onClick={onClick}
          sx={{ height: '100%', p: 1.5, cursor: 'pointer' }}
        >
          {content}
        </CardActionArea>
      ) : (
        <Box sx={{ p: 1.5 }}>{content}</Box>
      )}
    </Card>
  );
}
