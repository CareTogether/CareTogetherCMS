import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EmailIcon from '@mui/icons-material/Email';
import NotesIcon from '@mui/icons-material/Notes';
import PhoneIcon from '@mui/icons-material/Phone';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Box,
  Card,
  CardActionArea,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import type { FamilyMemberRowV2 } from './familyMemberViewModel';
import { v2Typography } from './v2Typography';

type FamilyMemberCardV2Props = {
  row: FamilyMemberRowV2;
  onClick: (row: FamilyMemberRowV2) => void;
};

const MAX_VISIBLE_ARRANGEMENTS = 3;

function metadataItems(row: FamilyMemberRowV2) {
  return [
    row.ageLabel ? `Age ${row.ageLabel}` : undefined,
    row.genderLabel,
    row.ethnicity,
    row.householdStatusLabel,
  ].filter(Boolean) as string[];
}

function ContactSummary({ row }: { row: FamilyMemberRowV2 }) {
  if (!row.primaryPhone && !row.primaryEmail) {
    return null;
  }

  return (
    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
      {row.primaryPhone && (
        <Stack
          direction="row"
          spacing={0.75}
          sx={{ alignItems: 'center', minWidth: 0 }}
        >
          <PhoneIcon color="action" fontSize="small" sx={{ flex: '0 0 auto' }} />
          <Typography {...v2Typography.browserCell} noWrap sx={{ minWidth: 0 }}>
            {row.primaryPhone}
          </Typography>
        </Stack>
      )}
      {row.primaryEmail && (
        <Stack
          direction="row"
          spacing={0.75}
          sx={{ alignItems: 'center', minWidth: 0 }}
        >
          <EmailIcon color="action" fontSize="small" sx={{ flex: '0 0 auto' }} />
          <Typography {...v2Typography.browserCell} noWrap sx={{ minWidth: 0 }}>
            {row.primaryEmail}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}

function ArrangementSummary({ row }: { row: FamilyMemberRowV2 }) {
  if (row.activeArrangements.length === 0) {
    return null;
  }

  const visibleArrangements = row.activeArrangements.slice(
    0,
    MAX_VISIBLE_ARRANGEMENTS
  );
  const hiddenArrangements = row.activeArrangements.slice(
    MAX_VISIBLE_ARRANGEMENTS
  );

  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'flex',
        flexWrap: 'nowrap',
        gap: 0.5,
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      {visibleArrangements.map((arrangement) => (
        <Box
          key={`${arrangement.v1CaseId}:${arrangement.arrangementId}`}
          sx={{
            bgcolor: 'action.hover',
            border: 1,
            borderColor: 'transparent',
            borderRadius: 0.75,
            color: 'text.secondary',
            minWidth: 0,
            px: 0.75,
            py: 0.125,
          }}
        >
          <Typography
            {...v2Typography.browserSecondary}
            color="text.secondary"
            noWrap
            sx={{ maxWidth: 140 }}
          >
            {arrangement.label}
          </Typography>
        </Box>
      ))}
      {hiddenArrangements.length > 0 && (
        <Tooltip
          arrow
          title={
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {hiddenArrangements.map((arrangement) => (
                <Typography
                  key={`${arrangement.v1CaseId}:${arrangement.arrangementId}`}
                  {...v2Typography.browserCell}
                >
                  {arrangement.label}
                </Typography>
              ))}
            </Box>
          }
        >
          <Box
            component="span"
            aria-label={`${hiddenArrangements.length} more arrangements: ${hiddenArrangements
              .map((arrangement) => arrangement.label)
              .join(', ')}`}
            sx={{
              bgcolor: 'background.default',
              border: 1,
              borderColor: 'transparent',
              borderRadius: 0.75,
              color: 'text.secondary',
              flex: '0 0 auto',
              px: 0.75,
              py: 0.125,
            }}
            tabIndex={0}
          >
            <Typography {...v2Typography.browserSecondary}>
              +{hiddenArrangements.length} more
            </Typography>
          </Box>
        </Tooltip>
      )}
    </Box>
  );
}

function multilineTextSx(lines: number) {
  return {
    display: '-webkit-box',
    overflow: 'hidden',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: lines,
    whiteSpace: 'pre-line',
  };
}

function DetailPreview({
  icon,
  iconColor = 'text.secondary',
  text,
}: {
  icon: ReactNode;
  iconColor?: string;
  text: string;
}) {
  return (
    <Tooltip
      arrow
      title={<Box sx={{ whiteSpace: 'pre-line' }}>{text}</Box>}
      disableInteractive
    >
      <Box
        sx={{
          alignItems: 'flex-start',
          display: 'flex',
          gap: 0.7,
          minWidth: 0,
        }}
      >
        <Box sx={{ color: iconColor, display: 'flex', opacity: 0.68, pt: 0.2 }}>
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            color="text.primary"
            sx={multilineTextSx(2)}
          >
            {text}
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  );
}

function MemberHighlights({ row }: { row: FamilyMemberRowV2 }) {
  const concerns = row.person.concerns?.trim();
  const notes = row.person.notes?.trim();

  if (!concerns && !notes) {
    return null;
  }

  return (
    <Stack spacing={0.6}>
      {concerns && (
        <DetailPreview
          icon={<WarningAmberIcon fontSize="small" />}
          iconColor="warning.main"
          text={concerns}
        />
      )}
      {notes && (
        <DetailPreview icon={<NotesIcon fontSize="small" />} text={notes} />
      )}
    </Stack>
  );
}

export function FamilyMemberCardV2({ row, onClick }: FamilyMemberCardV2Props) {
  const items = metadataItems(row);
  const hasActiveArrangements = row.activeArrangements.length > 0;
  const hasHighlights = Boolean(
    row.person.concerns?.trim() || row.person.notes?.trim()
  );

  return (
    <Card
      variant="outlined"
      sx={{
        bgcolor: 'background.paper',
        borderColor: 'divider',
        height: '100%',
        transition: (theme) =>
          theme.transitions.create(
            ['border-color', 'box-shadow', 'transform'],
            {
              duration: theme.transitions.duration.shortest,
            }
          ),
        '&:hover': {
          borderColor: 'primary.light',
          boxShadow: 2,
          transform: 'translateY(-1px)',
        },
        '&:focus-within': {
          borderColor: 'primary.light',
          boxShadow: 2,
        },
      }}
    >
      <CardActionArea
        aria-label={`Open details for ${row.displayName}`}
        onClick={() => onClick(row)}
        sx={{
          alignItems: 'stretch',
          cursor: 'pointer',
          display: 'flex',
          height: '100%',
          textAlign: 'left',
          '&.Mui-focusVisible': {
            outline: (theme) => `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        }}
      >
        <Stack spacing={1.15} sx={{ minWidth: 0, p: 2, width: '100%' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack
                direction="row"
                spacing={0.75}
                sx={{ alignItems: 'baseline', minWidth: 0 }}
              >
                <Typography
                  variant="subtitle1"
                  noWrap
                  sx={{
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}
                >
                  {row.displayName}
                </Typography>
                <Typography
                  color="text.secondary"
                  variant="caption"
                  sx={{
                    flex: '0 0 auto',
                    fontSize: '0.6875rem',
                    letterSpacing: 0,
                    lineHeight: 1.25,
                    textTransform: 'uppercase',
                  }}
                >
                  {row.personType}
                </Typography>
              </Stack>
              {row.relationshipSummary && (
                <Typography
                  {...v2Typography.browserSecondary}
                  color="text.secondary"
                  noWrap
                  sx={{ lineHeight: 1.35 }}
                >
                  {row.relationshipSummary}
                </Typography>
              )}
            </Box>
            <ChevronRightIcon
              fontSize="small"
              sx={{ color: 'text.secondary', flex: '0 0 auto', mt: 0.25 }}
            />
          </Stack>

          {items.length > 0 && (
            <Typography
              {...v2Typography.browserSecondary}
              color="text.secondary"
              noWrap
              sx={{ lineHeight: 1.35, opacity: 0.78 }}
            >
              {items.join(' | ')}
            </Typography>
          )}

          <ContactSummary row={row} />

          {hasActiveArrangements && (
            <ArrangementSummary row={row} />
          )}

          {hasHighlights && (
            <Box sx={{ pt: 0.35 }}>
              <MemberHighlights row={row} />
            </Box>
          )}
        </Stack>
      </CardActionArea>
    </Card>
  );
}
