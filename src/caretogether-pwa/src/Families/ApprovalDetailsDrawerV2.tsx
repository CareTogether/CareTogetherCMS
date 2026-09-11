import { Permission } from '../GeneratedClient';
import {
  ApprovalDetailsDrawerLayout,
  ApprovalDocumentList,
  ApprovalHeaderActions,
} from '../Approvals/ApprovalDetailsDrawerLayout';
import {
  ApprovalNoteList,
  type ApprovalNoteListEntry,
} from '../Approvals/ApprovalNoteList';
import type { ApprovalLedgerRow } from '../Approvals/approvalLedgerViewModel';
import { useApprovalDetailsController } from '../Approvals/useApprovalDetailsController';
import { useFamilyLookup, useNoteAuthorLookup } from '../Model/DirectoryModel';
import { useFamilyPermissions } from '../Model/SessionModel';
import { formatUtcDateOnly } from '../Utilities/dateUtils';
import { PersonName } from './PersonName';
import { RequirementManagementDrawerV2 } from './RequirementManagementDrawerV2';

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

export function ApprovalDetailsDrawerV2({
  row,
  open,
  onClose,
}: ApprovalDetailsDrawerV2Props) {
  const {
    closeManagement,
    managementMode,
    selectManagementMode,
    workflowOccurrence,
  } = useApprovalDetailsController(row, open);
  const noteAuthorLookup = useNoteAuthorLookup();
  const familyLookup = useFamilyLookup();
  const family = familyLookup(familyIdFromRow(row));
  const permissions = useFamilyPermissions(family);
  const documents =
    family?.uploadedDocuments?.filter((document) =>
      row?.linkedDocumentIds.includes(document.uploadedDocumentId)
    ) ?? [];
  const notes =
    family?.notes?.filter((note) => row?.noteIds.includes(note.id)) ?? [];
  const noteEntries: ApprovalNoteListEntry[] = [
    ...notes.map((note) => {
      const date = note.backdatedTimestampUtc ?? note.createdTimestampUtc;
      return {
        id: note.id,
        contents: note.contents ?? '',
        attribution: (
          <>
            <PersonName person={noteAuthorLookup(note)} />
            {date ? ` on ${formatUtcDateOnly(date)}` : ''}
          </>
        ),
      };
    }),
    ...(row?.notes ?? []).map((contents, index) => ({
      id: `text:${contents}:${index}`,
      contents,
    })),
  ];

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
            onSelectMode={selectManagementMode}
          />
        }
        documents={
          <ApprovalDocumentList
            canReadDocuments={permissions(Permission.ReadFamilyDocuments)}
            documents={documents}
          />
        }
        notes={<ApprovalNoteList entries={noteEntries} />}
      />
      <RequirementManagementDrawerV2
        mode={managementMode}
        occurrence={workflowOccurrence}
        open={managementMode !== null}
        onClose={closeManagement}
      />
    </>
  );
}
