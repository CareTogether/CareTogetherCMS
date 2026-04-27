import {
  Activity,
  UploadedDocumentInfo,
  V1Referral,
  V1ReferralAccepted,
  V1ReferralClosed,
  V1ReferralNoteEntry,
  V1ReferralOpened,
  V1ReferralRequirementCompleted,
} from '../GeneratedClient';

export type GroupedV1ReferralTimelineEntry =
  | {
      kind: 'activity';
      timestamp: Date;
      userId?: string;
      label: string;
      activity: Activity;
      document?: UploadedDocumentInfo;
      note?: V1ReferralNoteEntry;
    }
  | {
      kind: 'document';
      timestamp: Date;
      userId?: string;
      label: string;
      document: UploadedDocumentInfo;
    }
  | {
      kind: 'note';
      timestamp: Date;
      userId?: string;
      label: string;
      note: V1ReferralNoteEntry;
    };

function noteTimestamp(note: V1ReferralNoteEntry): Date | undefined {
  return (
    note.backdatedTimestampUtc ??
    note.createdTimestampUtc ??
    note.lastEditTimestampUtc
  );
}

function noteLabel(note: V1ReferralNoteEntry): string {
  return note.status === 0 ? 'Draft note' : 'Approved note';
}

function activityLabel(activity: Activity): string | null {
  if (activity instanceof V1ReferralOpened) {
    return 'Referral opened';
  }

  if (activity instanceof V1ReferralAccepted) {
    return 'Referral accepted';
  }

  if (activity instanceof V1ReferralClosed) {
    return activity.closeReason
      ? `Referral closed: ${activity.closeReason}`
      : 'Referral closed';
  }

  if (activity instanceof V1ReferralRequirementCompleted) {
    return `Completed requirement: ${activity.requirementName}`;
  }

  return null;
}

export function buildGroupedV1ReferralTimelineEntries(
  referral: V1Referral
): GroupedV1ReferralTimelineEntry[] {
  const documentsById = new Map<string, UploadedDocumentInfo>();
  const notesById = new Map<string, V1ReferralNoteEntry>();
  const linkedDocumentIds = new Set<string>();
  const linkedNoteIds = new Set<string>();

  for (const document of referral.uploadedDocuments ?? []) {
    if (document.uploadedDocumentId) {
      documentsById.set(document.uploadedDocumentId, document);
    }
  }

  for (const note of referral.notes ?? []) {
    if (note.id) {
      notesById.set(note.id, note);
    }
  }

  const entries: GroupedV1ReferralTimelineEntry[] = [];

  for (const activity of referral.history ?? []) {
    const label = activityLabel(activity);
    if (!label) continue;

    const documentId = activity.uploadedDocumentId;
    const noteId = activity.noteId;

    if (documentId) linkedDocumentIds.add(documentId);
    if (noteId) linkedNoteIds.add(noteId);

    entries.push({
      kind: 'activity',
      timestamp: activity.activityTimestampUtc,
      userId: activity.userId,
      label,
      activity,
      document: documentId ? documentsById.get(documentId) : undefined,
      note: noteId ? notesById.get(noteId) : undefined,
    });
  }

  for (const document of referral.uploadedDocuments ?? []) {
    if (
      document.uploadedDocumentId &&
      linkedDocumentIds.has(document.uploadedDocumentId)
    ) {
      continue;
    }

    entries.push({
      kind: 'document',
      timestamp: document.timestampUtc,
      userId: document.userId,
      label: `Document uploaded: ${document.uploadedFileName}`,
      document,
    });
  }

  for (const note of referral.notes ?? []) {
    if (note.id && linkedNoteIds.has(note.id)) {
      continue;
    }

    const timestamp = noteTimestamp(note);
    if (!timestamp) continue;

    entries.push({
      kind: 'note',
      timestamp,
      userId: note.authorId,
      label: noteLabel(note),
      note,
    });
  }

  entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return entries;
}
