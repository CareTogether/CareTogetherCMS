import {
  Timeline,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
} from '@mui/lab';
import { Box, CircularProgress, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import DescriptionIcon from '@mui/icons-material/Description';
import { format } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  V1Referral,
  V1ReferralNoteEntry,
  V1ReferralStatus,
} from '../GeneratedClient';

import { useV1ReferralNotesModel } from '../Model/V1ReferralNotesModel';
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

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  return 'Unexpected error';
}

export function ReferralTimeline({ referral }: ReferralTimelineProps) {
  const userLookup = useUserLookup();
  const { listReferralNotes } = useV1ReferralNotesModel();

  const [notes, setNotes] = useState<V1ReferralNoteEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const result = await listReferralNotes(referral.referralId);
        if (requestId === requestIdRef.current) {
          setNotes(result ?? []);
        }
      } catch (e: unknown) {
        if (requestId === requestIdRef.current) {
          setError(getErrorMessage(e));
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    })();
  }, [referral.referralId, listReferralNotes]);

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
      out.push({
        kind: 'requirement',
        timestamp: c.completedAtUtc ?? c.timestampUtc ?? referral.createdAtUtc,
        userId: c.userId,
        label: `Completed requirement: ${c.requirementName}`,
        noteId: c.noteId ?? null,
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

    for (const n of notes ?? []) {
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
  }, [referral, notes]);

  return (
    <Box>
      {loading && notes.length === 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="body2">Loading notes…</Typography>
        </Box>
      )}

      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 1 }}>
          {error}
        </Typography>
      )}

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
