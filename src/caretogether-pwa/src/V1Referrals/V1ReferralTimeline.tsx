import {
  Check as CheckIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import {
  Timeline,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
} from '@mui/lab';
import { Box, Typography } from '@mui/material';
import { format } from 'date-fns';
import { useMemo } from 'react';

import { V1Referral, V1ReferralRequirementCompleted } from '../GeneratedClient';

import { useUserLookup } from '../Model/DirectoryModel';
import { PersonName } from '../Families/PersonName';
import { V1ReferralNoteCard } from '../V1Referrals/V1ReferralNoteCard';
import { buildGroupedV1ReferralTimelineEntries } from './referralTimelineHelpers';

type ReferralTimelineProps = {
  referral: V1Referral;
  canManageNotes: boolean;
};

export function ReferralTimeline({
  referral,
  canManageNotes,
}: ReferralTimelineProps) {
  const userLookup = useUserLookup();

  const items = useMemo(
    () => buildGroupedV1ReferralTimelineEntries(referral),
    [referral]
  );

  function isRequirementEntry(item: (typeof items)[number]) {
    return (
      item.kind === 'activity' &&
      item.activity instanceof V1ReferralRequirementCompleted
    );
  }

  return (
    <Box>
      <Timeline position="right" sx={{ p: 0 }}>
        {items.map((item, i) => (
          <TimelineItem key={`${item.kind}:${i}`}>
            <TimelineOppositeContent sx={{ display: 'none' }} />
            <TimelineSeparator>
              <TimelineDot
                sx={{
                  width: 36,
                  height: 36,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {isRequirementEntry(item) ? (
                  <CheckIcon fontSize="small" />
                ) : item.kind === 'document' ? (
                  <DescriptionIcon fontSize="small" />
                ) : (
                  <EditIcon fontSize="small" />
                )}
              </TimelineDot>
              {i < items.length - 1 && <TimelineConnector />}
            </TimelineSeparator>

            <TimelineContent
              sx={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}
            >
              <Box sx={{ color: 'text.disabled', mb: 0.5 }}>
                <span style={{ marginRight: 16 }}>
                  {format(item.timestamp, 'M/d/yy h:mm a')}
                </span>
                {item.userId ? (
                  <PersonName person={userLookup(item.userId)} />
                ) : null}
              </Box>

              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {item.label}
              </Typography>

              {item.kind === 'activity' && item.document && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  Document: {item.document.uploadedFileName}
                </Typography>
              )}

              {item.kind === 'activity' && item.note && (
                <V1ReferralNoteCard
                  referralId={referral.referralId}
                  note={item.note}
                  canEdit={canManageNotes}
                  canDiscard={canManageNotes}
                  canApprove={canManageNotes}
                />
              )}

              {item.kind === 'note' && (
                <V1ReferralNoteCard
                  referralId={referral.referralId}
                  note={item.note}
                  canEdit={canManageNotes}
                  canDiscard={canManageNotes}
                  canApprove={canManageNotes}
                />
              )}
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </Box>
  );
}
