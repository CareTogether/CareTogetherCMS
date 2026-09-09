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
import type { ReactNode } from 'react';
import type { UploadedDocumentInfo } from '../GeneratedClient';
import { PersonName } from '../Families/PersonName';
import { v2Typography } from '../Families/v2Typography';
import { useUserLookup } from '../Model/DirectoryModel';
import { formatUtcDateOnly } from '../Utilities/dateUtils';
import {
  approvalLedgerStatusColor,
  approvalLedgerStatusLabels,
} from './approvalLedgerDataGridViewModel';
import type {
  ApprovalLedgerOccurrence,
  ApprovalLedgerRow,
} from './approvalLedgerViewModel';
import type { ApprovalRequirementManagementMode } from './approvalDetails';

export function ApprovalHeaderActions({
  occurrence,
  canComplete,
  canExempt,
  onSelectMode,
}: {
  occurrence: ApprovalLedgerOccurrence | undefined;
  canComplete: boolean;
  canExempt: boolean;
  onSelectMode: (mode: ApprovalRequirementManagementMode) => void;
}) {
  if (!occurrence) return null;

  if (
    occurrence.status === 'missing' ||
    occurrence.status === 'availableApplication'
  ) {
    return (
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Button
          disabled={!canComplete}
          onClick={() => onSelectMode('complete')}
          variant="contained"
        >
          Complete
        </Button>
        <Button
          disabled={!canExempt}
          onClick={() => onSelectMode('grantExemption')}
          variant="contained"
        >
          Exempt
        </Button>
      </Stack>
    );
  }

  if (occurrence.status === 'completed') {
    return (
      <Button
        color="error"
        disabled={!canComplete}
        onClick={() => onSelectMode('markIncomplete')}
        variant="contained"
      >
        Mark Incomplete
      </Button>
    );
  }

  return (
    <Button
      color="error"
      disabled={!canExempt}
      onClick={() => onSelectMode('removeExemption')}
      variant="contained"
    >
      Remove Exemption
    </Button>
  );
}

export function ApprovalDrawerSection({
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

export function ApprovalDocumentList({
  canReadDocuments,
  documents,
}: {
  canReadDocuments: boolean;
  documents: UploadedDocumentInfo[];
}) {
  const userLookup = useUserLookup();

  if (!canReadDocuments) {
    return (
      <Typography {...v2Typography.secondaryValue}>
        You do not have permission to view documents.
      </Typography>
    );
  }

  if (documents.length === 0) {
    return (
      <Typography {...v2Typography.secondaryValue}>No documents.</Typography>
    );
  }

  return (
    <Stack component="ul" spacing={1} sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {documents.map((document) => (
        <Box
          component="li"
          key={document.uploadedDocumentId}
          sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}
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

function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Box>
      <Typography {...v2Typography.fieldLabel}>{label}</Typography>
      <Typography {...v2Typography.primaryValue}>{children}</Typography>
    </Box>
  );
}

function RoleChipList({ labels }: { labels: string[] }) {
  if (labels.length === 0) {
    return <Typography {...v2Typography.primaryValue}>None</Typography>;
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

export function ApprovalDetailsDrawerLayout({
  row,
  open,
  onClose,
  titleId,
  headerActions,
  documents,
  notes,
}: {
  row: ApprovalLedgerRow | null;
  open: boolean;
  onClose: () => void;
  titleId: string;
  headerActions: ReactNode;
  documents: ReactNode;
  notes: ReactNode;
}) {
  const userLookup = useUserLookup();
  const completedOrExemptedOn = row?.completedOrExemptedOn
    ? formatUtcDateOnly(row.completedOrExemptedOn)
    : undefined;
  const validUntil = row?.validUntil
    ? formatUtcDateOnly(row.validUntil)
    : undefined;

  return (
    <Drawer
      anchor="right"
      aria-labelledby={titleId}
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
                className="ph-unmask"
                id={titleId}
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
                  className="ph-unmask"
                  color={approvalLedgerStatusColor(row.status)}
                  label={approvalLedgerStatusLabels[row.status]}
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
              {row.appliesTo.map(({ label }) => label).join(', ') ||
                'No subject'}
            </DetailField>
            <Box>
              <Typography {...v2Typography.fieldLabel}>
                Needed For Roles
              </Typography>
              <RoleChipList labels={row.neededForRoleLabels} />
            </Box>
            {row.completedOrExemptedByUserId && (
              <DetailField
                label={
                  row.status === 'completed' ? 'Completed By' : 'Exempted By'
                }
              >
                <PersonName
                  person={userLookup(row.completedOrExemptedByUserId)}
                />
              </DetailField>
            )}
            {completedOrExemptedOn && (
              <DetailField
                label={
                  row.status === 'completed' ? 'Completed On' : 'Exempted On'
                }
              >
                {completedOrExemptedOn}
              </DetailField>
            )}
            {validUntil && (
              <DetailField
                label={
                  row.status === 'completed' ? 'Valid Until' : 'Exempted Until'
                }
              >
                {validUntil}
              </DetailField>
            )}
          </Stack>

          <ApprovalDrawerSection title="Documents">
            {documents}
          </ApprovalDrawerSection>
          <ApprovalDrawerSection title="Notes">{notes}</ApprovalDrawerSection>
        </Stack>
      )}
    </Drawer>
  );
}
