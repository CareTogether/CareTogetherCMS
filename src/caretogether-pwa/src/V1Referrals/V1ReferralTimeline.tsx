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

import {
  V1Referral,
  V1ReferralNoteEntry,
  V1ReferralStatus,
} from '../GeneratedClient';

import { useUserLookup } from '../Model/DirectoryModel';
import { PersonName } from '../Families/PersonName';
import { V1ReferralNoteCard } from '../V1Referrals/V1ReferralNoteCard';

type ReferralTimelineProps = {
  referral: V1Referral;
};

type ReferralTimelineItem =
  | {
      kind: 'referral';
      timestamp: Date;
      userId?: string;
      label: string;
    }
  | {
      kind: 'requirement';
      timestamp: Date;
      userId?: string;
      label: string;
      noteId?: string | null;
      noteText?: string | null;
    }
  | {
      kind: 'document';
      timestamp: Date;
      userId?: string;
      label: string;
    }
  | {
      kind: 'note';
      timestamp: Date;
      userId?: string;
      label: string;
      note: V1ReferralNoteEntry;
    };

function resolveReferralNoteText(
  note: V1ReferralNoteEntry | undefined
): string | null {
  const text = note?.contents ?? null;
  return text && text.trim() ? text : null;
}

export function ReferralTimeline({ referral }: ReferralTimelineProps) {
  const userLookup = useUserLookup();

  const notesById = useMemo(() => {
    const map = new Map<string, V1ReferralNoteEntry>();
    for (const n of referral.notes ?? []) {
      if (n.id) map.set(n.id, n);
    }
    return map;
  }, [referral.notes]);

  const items: ReferralTimelineItem[] = useMemo(() => {
    const out: ReferralTimelineItem[] = [];

    out.push({
      kind: 'referral',
      timestamp: referral.createdAtUtc,
      label: 'Referral opened',
    });

    if (
      referral.status === V1ReferralStatus.Accepted &&
      referral.acceptedAtUtc
    ) {
      out.push({
        kind: 'referral',
        timestamp: referral.acceptedAtUtc,
        label: 'Referral accepted',
      });
    }

    if (referral.status === V1ReferralStatus.Closed && referral.closedAtUtc) {
      out.push({
        kind: 'referral',
        timestamp: referral.closedAtUtc,
        label: `Referral closed${
          referral.closeReason ? `: ${referral.closeReason}` : ''
        }`,
      });
    }

    for (const c of referral.completedRequirements ?? []) {
      const noteId = c.noteId ?? null;
      const noteText = noteId
        ? resolveReferralNoteText(notesById.get(noteId))
        : null;

      out.push({
        kind: 'requirement',
        timestamp: c.completedAtUtc ?? c.timestampUtc ?? referral.createdAtUtc,
        userId: c.userId,
        label: `Completed requirement: ${c.requirementName}`,
        noteId,
        noteText,
      });
    }

    for (const e of referral.exemptedRequirements ?? []) {
      out.push({
        kind: 'requirement',
        timestamp: e.timestampUtc ?? referral.createdAtUtc,
        userId: e.userId,
        label: `Exempted requirement: ${e.requirementName}`,
      });
    }

    for (const d of referral.uploadedDocuments ?? []) {
      out.push({
        kind: 'document',
        timestamp: d.timestampUtc ?? referral.createdAtUtc,
        userId: d.userId,
        label: `Document uploaded: ${d.uploadedFileName}`,
      });
    }

    for (const n of referral.notes ?? []) {
      out.push({
        kind: 'note',
        timestamp:
          n.backdatedTimestampUtc ??
          n.createdTimestampUtc ??
          n.lastEditTimestampUtc,
        userId: n.authorId,
        label: n.status === 0 ? 'Draft note' : 'Approved note',
        note: n,
      });
    }

    out.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return out;
  }, [referral, notesById]);

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
                {item.kind === 'requirement' ? (
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

              {item.kind === 'requirement' && item.noteText?.trim() && (
                <Typography
                  variant="body2"
                  sx={{ fontStyle: 'italic', opacity: 0.85, mb: 0.5 }}
                >
                  {item.noteText.trim()}
                </Typography>
              )}

              {item.kind === 'note' && (
                <V1ReferralNoteCard
                  referralId={referral.referralId}
                  note={item.note}
                  canEdit
                  canDiscard
                  canApprove
                />
              )}
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </Box>
  );
}
