import { Box, Stack } from '@mui/material';
import { Fragment } from 'react';
import { RoleSummaryCardV2 } from './RoleSummaryCardV2';
import { WorkResolutionFocus } from '../Generic/WorkResolutionFocus';
import type {
  RemovedRoleSummary,
  RoleSummaryCard,
} from './roleSummaryViewModel';

type RoleSummaryCardsSectionProps = {
  cards: RoleSummaryCard[];
  linkedCardId?: string;
  removedRoles?: RemovedRoleSummary[];
  onCardClick?: (card: RoleSummaryCard) => void;
  onRemovedRoleClick?: (removedRole: RemovedRoleSummary) => void;
};

export function RoleSummaryCardsSection({
  cards,
  linkedCardId,
  removedRoles = [],
  onCardClick,
  onRemovedRoleClick,
}: RoleSummaryCardsSectionProps) {
  if (cards.length === 0 && removedRoles.length === 0) {
    return null;
  }

  return (
    <Box data-tour="family-role-cards" sx={{ mb: 2 }}>
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
          {cards.map((card) => {
            const content = (
              <RoleSummaryCardV2
                card={card}
                onClick={onCardClick ? () => onCardClick(card) : undefined}
              />
            );
            return card.id === linkedCardId ? (
              <WorkResolutionFocus key={card.id}>{content}</WorkResolutionFocus>
            ) : (
              <Fragment key={card.id}>{content}</Fragment>
            );
          })}
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
