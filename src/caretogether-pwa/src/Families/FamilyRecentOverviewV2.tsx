import {
  Box,
  Button,
  Typography,
} from '@mui/material';
import {
  Notes as NotesIcon,
  PersonPinCircle as PersonPinCircleIcon,
} from '@mui/icons-material';
import { ComponentProps, ReactNode } from 'react';
import { format } from 'date-fns';
import { Activity, Note, V1Referral } from '../GeneratedClient';
import { formatTimelineTimestamp } from '../Activities/timelineTimestampFormatting';
import { ClampTypography } from '../Generic/ClampTypography';
import { PersonName } from './PersonName';

type ReferralNoteEntry = NonNullable<V1Referral['notes']>[number];
type PersonNamePerson = ComponentProps<typeof PersonName>['person'];

export type RecentOverviewTimelineItem = {
  activity?: Activity;
  id: string;
  timestamp: Date;
  title: string;
  subtitle?: string;
  userId?: string;
  note?: Note;
  referralNote?: ReferralNoteEntry;
  referralId?: string;
  icon: 'check' | 'edit' | 'location';
};

type FamilyPinnedNotesV2Props = {
  notes: Note[];
  noteAuthorLookup: (note: Note) => PersonNamePerson;
};

export function FamilyPinnedNotesV2({
  notes,
  noteAuthorLookup,
}: FamilyPinnedNotesV2Props) {
  if (notes.length === 0) return null;

  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'primary.light',
        borderRadius: 1,
        bgcolor: 'rgba(25, 118, 210, 0.06)',
        p: 1.5,
        mb: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {notes.map((note) => (
          <Box
            key={note.id}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.paper',
              p: 1.25,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              <PersonName person={noteAuthorLookup(note)} />
              {note.createdTimestampUtc && (
                <>
                  {' \u00b7 '}
                  {format(note.createdTimestampUtc, 'M/d/yy h:mm a')}
                </>
              )}
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {note.contents}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

type FamilyRecentOverviewV2Props = {
  items: RecentOverviewTimelineItem[];
  noteAuthorLookup: (note: Note) => PersonNamePerson;
  renderRecentNoteActions: (item: RecentOverviewTimelineItem) => ReactNode;
  userLookup: (userId: string) => PersonNamePerson;
  onViewAll: () => void;
};

export function FamilyRecentOverviewV2({
  items,
  noteAuthorLookup,
  renderRecentNoteActions,
  userLookup,
  onViewAll,
}: FamilyRecentOverviewV2Props) {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        p: 2,
        ml: { lg: 2 },
        mt: { xs: 2, lg: 0 },
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography variant="h3" className="ph-unmask" sx={{ m: 0 }}>
          Recent Activity: Last 7 days
        </Typography>
        <Button className="ph-unmask" size="small" onClick={onViewAll}>
          View All
        </Button>
      </Box>

      {items.length === 0 ? (
        <Typography
          className="ph-unmask"
          color="text.secondary"
          variant="body2"
        >
          No recent activity in the last 7 days.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map((item) => (
            <Box
              key={item.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: '32px 1fr',
                columnGap: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.secondary',
                }}
              >
                {item.icon === 'check' ? (
                  '\u2714'
                ) : item.icon === 'location' ? (
                  <PersonPinCircleIcon fontSize="small" />
                ) : (
                  <NotesIcon fontSize="small" />
                )}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">
                  {formatTimelineTimestamp(
                    {
                      activity: item.activity,
                      kind: item.activity ? 'family-activity' : 'recent',
                      timestamp: item.timestamp,
                    },
                    {
                      date: 'MMM d',
                      dateTime: 'MMM d, h:mm a',
                    }
                  )}
                </Typography>
                <Typography variant="body2">
                  {item.userId ? (
                    <PersonName person={userLookup(item.userId)} />
                  ) : item.note ? (
                    <PersonName person={noteAuthorLookup(item.note)} />
                  ) : (
                    item.title
                  )}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {item.title}
                </Typography>
                {item.subtitle && (
                  <ClampTypography variant="body2" color="text.secondary">
                    {item.subtitle}
                  </ClampTypography>
                )}
                {renderRecentNoteActions(item)}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
