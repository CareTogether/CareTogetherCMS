import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { formatUtcDateOnly } from '../Utilities/dateUtils';
import { RoleSummaryCardV2 } from './RoleSummaryCardV2';
import type {
  RemovedRoleSummary,
  RoleSummaryCard,
} from './roleSummaryViewModel';

type RoleSummaryCardsSectionProps = {
  cards: RoleSummaryCard[];
  removedRoles?: RemovedRoleSummary[];
  onCardClick?: (card: RoleSummaryCard) => void;
  onRemovedRoleClick?: (removedRole: RemovedRoleSummary) => void;
};

export function RoleSummaryCardsSection({
  cards,
  removedRoles = [],
  onCardClick,
  onRemovedRoleClick,
}: RoleSummaryCardsSectionProps) {
  if (cards.length === 0 && removedRoles.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      {cards.length > 0 && (
        <Box
          sx={{
            overflowX: 'auto',
            pb: 0.5,
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              width: 'max-content',
              minWidth: '100%',
              flexWrap: 'nowrap',
            }}
          >
            {cards.map((card) => (
              <RoleSummaryCardV2
                key={card.id}
                card={card}
                onClick={onCardClick ? () => onCardClick(card) : undefined}
              />
            ))}
          </Stack>
        </Box>
      )}

      {removedRoles.length > 0 && (
        <Box sx={{ mt: cards.length > 0 ? 1.5 : 0 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            Recently Removed
          </Typography>
          <List disablePadding>
            {removedRoles.map((removedRole) => (
              <ListItemButton
                key={removedRole.id}
                onClick={
                  onRemovedRoleClick
                    ? () => onRemovedRoleClick(removedRole)
                    : undefined
                }
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 0.75,
                }}
              >
                <ListItemText
                  className="ph-unmask"
                  primary={`${removedRole.subject.label} · ${removedRole.roleName}`}
                  secondary={
                    removedRole.roleRemoval.effectiveSince
                      ? `Removed ${formatUtcDateOnly(
                          removedRole.roleRemoval.effectiveSince
                        )}`
                      : 'Removed'
                  }
                  slotProps={{
                    primary: { variant: 'body2' },
                    secondary: { variant: 'caption' },
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
}
