import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import NotesIcon from '@mui/icons-material/Notes';
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
    row.relationshipSummary,
    row.ageLabel ? `Age ${row.ageLabel}` : undefined,
    row.genderLabel,
    row.ethnicity,
  ].filter(Boolean) as string[];
}

function ContactSummary({ row }: { row: FamilyMemberRowV2 }) {
  if (!row.primaryPhone && !row.primaryEmail) {
    return null;
  }

  return (
    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
      {row.primaryPhone && (
        <Typography {...v2Typography.browserCell} noWrap>
          {row.primaryPhone}
        </Typography>
      )}
      {row.primaryEmail && (
        <Typography
          {...v2Typography.browserSecondary}
          color="text.secondary"
          noWrap
        >
          {row.primaryEmail}
        </Typography>
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
            borderRadius: 0.75,
            minWidth: 0,
            px: 0.75,
            py: 0.25,
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
              bgcolor: 'action.hover',
              borderRadius: 0.75,
              color: 'text.secondary',
              flex: '0 0 auto',
              px: 0.75,
              py: 0.25,
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
  color = 'text.secondary',
  icon,
  label,
  text,
}: {
  color?: string;
  icon: ReactNode;
  label: string;
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
          color,
          display: 'flex',
          gap: 0.5,
          minWidth: 0,
        }}
      >
        <Box sx={{ display: 'flex', pt: 0.2 }}>{icon}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography {...v2Typography.fieldLabel}>{label}</Typography>
          <Typography {...v2Typography.browserSecondary} sx={multilineTextSx(2)}>
            {text}
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  );
}

function StatusDetails({ row }: { row: FamilyMemberRowV2 }) {
  const concerns = row.person.concerns?.trim();
  const notes = row.person.notes?.trim();

  if (!row.householdStatusLabel && !concerns && !notes) {
    return null;
  }

  return (
    <Stack spacing={0.35}>
      {row.householdStatusLabel && (
        <Typography {...v2Typography.browserSecondary} color="text.secondary">
          {row.householdStatusLabel}
        </Typography>
      )}
      {concerns && (
        <DetailPreview
          color="warning.dark"
          icon={<WarningAmberIcon fontSize="small" />}
          label="Concerns"
          text={concerns}
        />
      )}
      {notes && (
        <DetailPreview
          icon={<NotesIcon fontSize="small" />}
          label="Comments"
          text={notes}
        />
      )}
    </Stack>
  );
}

export function FamilyMemberCardV2({ row, onClick }: FamilyMemberCardV2Props) {
  const items = metadataItems(row);
  const hasActiveArrangements = row.activeArrangements.length > 0;

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
        <Stack spacing={1.25} sx={{ minWidth: 0, p: 2, width: '100%' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack
                direction="row"
                spacing={0.75}
                sx={{ alignItems: 'center', minWidth: 0 }}
              >
                <Typography {...v2Typography.primaryValue} noWrap>
                  {row.displayName}
                </Typography>
                <Typography
                  color="text.secondary"
                  variant="caption"
                  sx={{ flex: '0 0 auto' }}
                >
                  {row.personType}
                </Typography>
              </Stack>
              {items.length > 0 && (
                <Typography
                  {...v2Typography.browserSecondary}
                  color="text.secondary"
                  noWrap
                >
                  {items.join(' • ')}
                </Typography>
              )}
            </Box>
            <ChevronRightIcon
              fontSize="small"
              sx={{ color: 'text.secondary', flex: '0 0 auto', mt: 0.25 }}
            />
          </Stack>

          <ContactSummary row={row} />

          {hasActiveArrangements && (
            <Stack spacing={0.75}>
              <Typography {...v2Typography.fieldLabel}>Arrangements</Typography>
              <ArrangementSummary row={row} />
            </Stack>
          )}

          <StatusDetails row={row} />
        </Stack>
      </CardActionArea>
    </Card>
  );
}
