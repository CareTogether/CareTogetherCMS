import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { formatUtcDateOnly } from '../Utilities/dateUtils';
import {
  useFamilyLookup,
  useNoteAuthorLookup,
  useUserLookup,
} from '../Model/DirectoryModel';
import { PersonName } from './PersonName';
import { useState, type ReactNode } from 'react';
import { Note, Permission, UploadedDocumentInfo } from '../GeneratedClient';
import { useFamilyPermissions } from '../Model/SessionModel';
import {
  ApprovalLedgerRow,
  ApprovalLedgerStatus,
} from './approvalLedgerViewModel';
import {
  RequirementManagementDrawerV2,
  type RequirementManagementMode,
} from './RequirementManagementDrawerV2';
import { v2Typography } from './v2Typography';

type ApprovalDetailsDrawerV2Props = {
  row: ApprovalLedgerRow | null;
  open: boolean;
  onClose: () => void;
};

const statusLabels: Record<ApprovalLedgerStatus, string> = {
  missing: 'Missing',
  completed: 'Completed',
  exempted: 'Exempted',
  expiring: 'Expiring',
  expired: 'Expired',
  availableApplication: 'Application',
};

function statusColor(status: ApprovalLedgerStatus) {
  switch (status) {
    case 'expired':
      return 'warning';
    case 'missing':
      return 'error';
    case 'expiring':
      return 'warning';
    case 'availableApplication':
      return 'info';
    case 'completed':
      return 'success';
    case 'exempted':
    default:
      return 'default';
  }
}

function formatDate(date?: Date) {
  return date ? formatUtcDateOnly(date) : undefined;
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Box>
      <Typography {...v2Typography.fieldLabel}>
        {label}
      </Typography>
      <Typography {...v2Typography.primaryValue}>
        {children}
      </Typography>
    </Box>
  );
}

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

function DocumentList({
  canReadDocuments,
  documents,
  userLookup,
}: {
  canReadDocuments: boolean;
  documents: UploadedDocumentInfo[];
  userLookup: ReturnType<typeof useUserLookup>;
}) {
  if (!canReadDocuments) {
    return (
      <Typography {...v2Typography.secondaryValue}>
        You do not have permission to view documents.
      </Typography>
    );
  }

  if (documents.length === 0) {
    return (
      <Typography {...v2Typography.secondaryValue}>
        No documents.
      </Typography>
    );
  }

  return (
    <Stack component="ul" spacing={1} sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {documents.map((document) => (
        <Box
          component="li"
          key={document.uploadedDocumentId}
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 1,
          }}
        >
          <Typography {...v2Typography.browserCell}>
            {document.uploadedFileName}
          </Typography>
          <Typography {...v2Typography.fieldLabel}>
            Uploaded by <PersonName person={userLookup(document.userId)} />
            {document.timestampUtc
              ? ` on ${formatUtcDateOnly(document.timestampUtc)}`
              : ''}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
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
    return (
      <Typography {...v2Typography.secondaryValue}>
        No notes.
      </Typography>
    );
  }

  return (
    <Stack component="ul" spacing={1} sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {notes.map((note) => {
        const date = note.backdatedTimestampUtc ?? note.createdTimestampUtc;

        return (
          <Box
            component="li"
            key={note.id}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 1,
            }}
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
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 1,
          }}
        >
          <Typography {...v2Typography.browserCell}>
            {note}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}

function DrawerSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <Stack spacing={1}>
      <Typography {...v2Typography.sectionTitle}>{title}</Typography>
      {children}
    </Stack>
  );
}

function RoleChipList({ labels }: { labels: string[] }) {
  if (labels.length === 0) {
    return (
      <Typography {...v2Typography.primaryValue}>
        None
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {labels.map((label) => (
        <Chip
          key={label}
          className="ph-unmask"
          label={label}
          size="small"
          variant="outlined"
        />
      ))}
    </Box>
  );
}

function labelsText(labels: string[], emptyLabel: string) {
  return labels.length === 0 ? emptyLabel : labels.join(', ');
}

function actionableOccurrence(row: ApprovalLedgerRow | null) {
  return row?.occurrences.find(
    (occurrence) =>
      occurrence.status === 'missing' ||
      occurrence.status === 'availableApplication' ||
      occurrence.status === 'completed' ||
      occurrence.status === 'exempted'
  );
}

export function ApprovalDetailsDrawerV2({
  row,
  open,
  onClose,
}: ApprovalDetailsDrawerV2Props) {
  const [selectedManagementMode, setSelectedManagementMode] =
    useState<RequirementManagementMode | null>(null);
  const userLookup = useUserLookup();
  const noteAuthorLookup = useNoteAuthorLookup();
  const familyLookup = useFamilyLookup();
  const family = familyLookup(familyIdFromRow(row));
  const permissions = useFamilyPermissions(family);
  const workflowOccurrence = actionableOccurrence(row);
  const completedOrExemptedOn = formatDate(row?.completedOrExemptedOn);
  const validUntil = formatDate(row?.validUntil);
  const hasMetadata =
    Boolean(row?.completedOrExemptedByUserId) ||
    Boolean(completedOrExemptedOn) ||
    Boolean(validUntil);
  const documents =
    family?.uploadedDocuments?.filter((document) =>
      row?.linkedDocumentIds.includes(document.uploadedDocumentId)
    ) ?? [];
  const notes =
    family?.notes?.filter((note) => row?.noteIds.includes(note.id)) ?? [];
  const canReadDocuments = permissions(Permission.ReadFamilyDocuments);
  const headerActions = (() => {
    if (!workflowOccurrence) {
      return null;
    }

    if (
      workflowOccurrence.status === 'missing' ||
      workflowOccurrence.status === 'availableApplication'
    ) {
      return (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Button
            disabled={
              !permissions(Permission.EditApprovalRequirementCompletion)
            }
            onClick={() => setSelectedManagementMode('complete')}
            variant="contained"
          >
            Complete
          </Button>
          <Button
            disabled={!permissions(Permission.EditApprovalRequirementExemption)}
            onClick={() => setSelectedManagementMode('grantExemption')}
            variant="contained"
          >
            Exempt
          </Button>
        </Stack>
      );
    }

    if (workflowOccurrence.status === 'completed') {
      return (
        <Button
          color="error"
          disabled={!permissions(Permission.EditApprovalRequirementCompletion)}
          onClick={() => setSelectedManagementMode('markIncomplete')}
          variant="contained"
        >
          Mark Incomplete
        </Button>
      );
    }

    return (
      <Button
        color="error"
        disabled={!permissions(Permission.EditApprovalRequirementExemption)}
        onClick={() => setSelectedManagementMode('removeExemption')}
        variant="contained"
      >
        Remove Exemption
      </Button>
    );
  })();

  return (
    <>
      <Drawer
        anchor="right"
        aria-labelledby="approval-details-title"
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 500, md: 560 },
              p: 2,
              pt: { xs: 7, sm: 8, md: 6 },
            },
          },
        }}
      >
        {row && (
          <Stack spacing={2}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 1,
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  {...v2Typography.fieldLabel}
                  sx={[
                    v2Typography.fieldLabel.sx,
                    { textTransform: 'uppercase' },
                  ]}
                >
                  Requirement
                </Typography>
                <Typography
                  id="approval-details-title"
                  {...v2Typography.workspaceTitle}
                >
                  {row.requirementName}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    mt: 1,
                    flexWrap: 'wrap',
                  }}
                >
                  <Chip
                    color={statusColor(row.status)}
                    label={statusLabels[row.status]}
                    size="small"
                  />
                  {headerActions}
                </Box>
              </Box>
              <IconButton aria-label="close approval details" onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Stack spacing={1.25}>
              <DetailField label="Applies To">
                {labelsText(
                  row.appliesTo.map((subject) => subject.label),
                  'No subject'
                )}
              </DetailField>

              <Box>
                <Typography {...v2Typography.fieldLabel}>
                  Needed For Roles
                </Typography>
                <RoleChipList labels={row.neededForRoleLabels} />
              </Box>

              {hasMetadata && (
                <>
                  {row.completedOrExemptedByUserId && (
                    <DetailField label={row.status === 'completed' ? 'Completed By' : 'Exempted By'}>
                      <PersonName
                        person={userLookup(row.completedOrExemptedByUserId)}
                      />
                    </DetailField>
                  )}
                  {completedOrExemptedOn && (
                    <DetailField label={row.status === 'completed' ? 'Completed On' : 'Exempted On'}>
                      {completedOrExemptedOn}
                    </DetailField>
                  )}
                  {validUntil && (
                    <DetailField label={row.status === 'completed' ? 'Valid Until' : 'Exempted Until'}>{validUntil}</DetailField>
                  )}
                </>
              )}
            </Stack>

            <DrawerSection title="Documents">
              <DocumentList
                canReadDocuments={canReadDocuments}
                documents={documents}
                userLookup={userLookup}
              />
            </DrawerSection>

            <DrawerSection title="Notes">
              <NoteList
                noteAuthorLookup={noteAuthorLookup}
                notes={notes}
                textNotes={row.notes}
              />
            </DrawerSection>
          </Stack>
        )}
      </Drawer>
      <RequirementManagementDrawerV2
        mode={selectedManagementMode}
        occurrence={workflowOccurrence}
        open={selectedManagementMode !== null}
        onClose={() => setSelectedManagementMode(null)}
      />
    </>
  );
}
