import { Box, Stack } from '@mui/material';
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
          {removedRoles.map((removedRole) => (
            <RoleSummaryCardV2
              key={removedRole.id}
              card={removedRole}
              onClick={
                onRemovedRoleClick
                  ? () => onRemovedRoleClick(removedRole)
                  : undefined
              }
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
