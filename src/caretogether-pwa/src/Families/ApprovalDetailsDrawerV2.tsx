import { Box, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { Note, Permission } from '../GeneratedClient';
import {
  ApprovalDetailsDrawerLayout,
  ApprovalDocumentList,
  ApprovalHeaderActions,
} from '../Approvals/ApprovalDetailsDrawerLayout';
import {
  findActionableApprovalOccurrence,
  type ApprovalRequirementManagementMode,
} from '../Approvals/approvalDetails';
import type { ApprovalLedgerRow } from '../Approvals/approvalLedgerViewModel';
import { useFamilyLookup, useNoteAuthorLookup } from '../Model/DirectoryModel';
import { useFamilyPermissions } from '../Model/SessionModel';
import { formatUtcDateOnly } from '../Utilities/dateUtils';
import { PersonName } from './PersonName';
import { RequirementManagementDrawerV2 } from './RequirementManagementDrawerV2';
import { v2Typography } from './v2Typography';

type ApprovalDetailsDrawerV2Props = {
  row: ApprovalLedgerRow | null;
  open: boolean;
  onClose: () => void;
};

function familyIdFromRow(row: ApprovalLedgerRow | null) {
  const context = row?.occurrences[0]?.context;
  if (
    context?.kind === 'Volunteer Family' ||
    context?.kind === 'Individual Volunteer'
  ) {
    return context.volunteerFamilyId;
  }

  return undefined;
}

function NoteList({
  noteAuthorLookup,
  notes,
  textNotes,
}: {
  noteAuthorLookup: ReturnType<typeof useNoteAuthorLookup>;
  notes: Note[];
  textNotes: string[];
}) {
  if (notes.length === 0 && textNotes.length === 0) {
    return <Typography {...v2Typography.secondaryValue}>No notes.</Typography>;
  }

  return (
    <Stack component="ul" spacing={1} sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {notes.map((note) => {
        const date = note.backdatedTimestampUtc ?? note.createdTimestampUtc;
        return (
          <Box
            component="li"
            key={note.id}
            sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}
          >
            <Typography {...v2Typography.browserCell}>
              {note.contents}
            </Typography>
            <Typography {...v2Typography.fieldLabel}>
              <PersonName person={noteAuthorLookup(note)} />
              {date ? ` on ${formatUtcDateOnly(date)}` : ''}
            </Typography>
          </Box>
        );
      })}
      {textNotes.map((note, index) => (
        <Box
          component="li"
          key={`${note}:${index}`}
          sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}
        >
          <Typography {...v2Typography.browserCell}>{note}</Typography>
        </Box>
      ))}
    </Stack>
  );
}

export function ApprovalDetailsDrawerV2({
  row,
  open,
  onClose,
}: ApprovalDetailsDrawerV2Props) {
  const [managementMode, setManagementMode] =
    useState<ApprovalRequirementManagementMode | null>(null);
  const noteAuthorLookup = useNoteAuthorLookup();
  const familyLookup = useFamilyLookup();
  const family = familyLookup(familyIdFromRow(row));
  const permissions = useFamilyPermissions(family);
  const workflowOccurrence = findActionableApprovalOccurrence(row);
  const documents =
    family?.uploadedDocuments?.filter((document) =>
      row?.linkedDocumentIds.includes(document.uploadedDocumentId)
    ) ?? [];
  const notes =
    family?.notes?.filter((note) => row?.noteIds.includes(note.id)) ?? [];

  return (
    <>
      <ApprovalDetailsDrawerLayout
        row={row}
        open={open}
        onClose={onClose}
        titleId="approval-details-title"
        headerActions={
          <ApprovalHeaderActions
            occurrence={workflowOccurrence}
            canComplete={permissions(
              Permission.EditApprovalRequirementCompletion
            )}
            canExempt={permissions(Permission.EditApprovalRequirementExemption)}
            onSelectMode={setManagementMode}
          />
        }
        documents={
          <ApprovalDocumentList
            canReadDocuments={permissions(Permission.ReadFamilyDocuments)}
            documents={documents}
          />
        }
        notes={
          <NoteList
            noteAuthorLookup={noteAuthorLookup}
            notes={notes}
            textNotes={row?.notes ?? []}
          />
        }
      />
      <RequirementManagementDrawerV2
        mode={managementMode}
        occurrence={workflowOccurrence}
        open={managementMode !== null}
        onClose={() => setManagementMode(null)}
      />
    </>
  );
}
