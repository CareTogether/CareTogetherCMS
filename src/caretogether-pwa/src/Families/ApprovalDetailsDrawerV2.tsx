import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { formatUtcDateOnly } from '../Utilities/dateUtils';
import { useUserLookup } from '../Model/DirectoryModel';
import { PersonName } from './PersonName';
import type { ReactNode } from 'react';
import {
  ApprovalLedgerRow,
  ApprovalLedgerStatus,
} from './approvalLedgerViewModel';
import { ApprovalWorkflowMissingSectionV2 } from './ApprovalWorkflowMissingSectionV2';
import { Permission } from '../GeneratedClient';
import { useFamilyIdPermissions } from '../Model/SessionModel';
import type { ApprovalLedgerOccurrence } from './approvalLedgerViewModel';
import { ApprovalWorkflowConfirmationSectionV2 } from './ApprovalWorkflowConfirmationSectionV2';
import { useApprovalWorkflowActionsV2 } from './hooks/useApprovalWorkflowActionsV2';

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

function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
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
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography className="ph-unmask" variant="body2">
        {children}
      </Typography>
    </Box>
  );
}

function ChipList({
  emptyLabel,
  labels,
}: {
  emptyLabel: string;
  labels: string[];
}) {
  if (labels.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        {emptyLabel}
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

function DrawerSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">{title}</Typography>
      {children}
    </Stack>
  );
}

function familyIdFromOccurrence(occurrence: ApprovalLedgerOccurrence | undefined) {
  if (
    occurrence?.context.kind === 'Volunteer Family' ||
    occurrence?.context.kind === 'Individual Volunteer'
  ) {
    return occurrence.context.volunteerFamilyId;
  }

  return '';
}

function actionableMissingOccurrence(row: ApprovalLedgerRow | null) {
  return row?.occurrences.find(
    (occurrence) =>
      occurrence.status === 'missing' ||
      occurrence.status === 'availableApplication'
  );
}

function actionableConfirmationOccurrence(row: ApprovalLedgerRow | null) {
  return row?.occurrences.find(
    (occurrence) =>
      occurrence.status === 'completed' || occurrence.status === 'exempted'
  );
}

export function ApprovalDetailsDrawerV2({
  row,
  open,
  onClose,
}: ApprovalDetailsDrawerV2Props) {
  const userLookup = useUserLookup();
  const workflowOccurrence = actionableMissingOccurrence(row);
  const confirmationOccurrence = actionableConfirmationOccurrence(row);
  const approvalWorkflowActions = useApprovalWorkflowActionsV2(
    confirmationOccurrence,
    onClose
  );
  const permissions = useFamilyIdPermissions(
    familyIdFromOccurrence(workflowOccurrence)
  );
  const canComplete = permissions(Permission.EditApprovalRequirementCompletion);
  const canExempt = permissions(Permission.EditApprovalRequirementExemption);
  const completedOrExemptedOn = formatDate(row?.completedOrExemptedOn);
  const validUntil = formatDate(row?.validUntil);
  const showSummary =
    Boolean(row?.completedOrExemptedByUserId) ||
    Boolean(completedOrExemptedOn) ||
    Boolean(validUntil);
  const evidenceItems = row
    ? [
        countLabel(row.linkedDocumentIds.length, 'document', 'documents'),
        countLabel(row.noteIds.length + row.notes.length, 'note', 'notes'),
      ]
    : [];

  return (
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
            <Box sx={{ minWidth: 0 }}>
              <Typography
                color="text.secondary"
                sx={{ textTransform: 'uppercase' }}
                variant="caption"
              >
                Approval Details
              </Typography>
              <Typography
                id="approval-details-title"
                className="ph-unmask"
                variant="h5"
              >
                {row.requirementName}
              </Typography>
              <Chip
                color={statusColor(row.status)}
                label={statusLabels[row.status]}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
            <IconButton aria-label="close approval details" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          <DrawerSection title="Applies To">
            <ChipList
              emptyLabel="No subject"
              labels={row.appliesTo.map((subject) => subject.label)}
            />
          </DrawerSection>

          <DrawerSection title="Needed For Roles">
            <ChipList emptyLabel="None" labels={row.neededForRoleLabels} />
          </DrawerSection>

          {showSummary && (
            <>
              <Divider />
              <DrawerSection title="Summary">
                <Stack spacing={1}>
                  {row.completedOrExemptedByUserId && (
                    <DetailField label="Completed/Exempted By">
                      <PersonName
                        person={userLookup(row.completedOrExemptedByUserId)}
                      />
                    </DetailField>
                  )}
                  {completedOrExemptedOn && (
                    <DetailField label="Completed/Exempted On">
                      {completedOrExemptedOn}
                    </DetailField>
                  )}
                  {validUntil && (
                    <DetailField label="Valid Until">{validUntil}</DetailField>
                  )}
                </Stack>
              </DrawerSection>
            </>
          )}

          <Divider />

          <DrawerSection title="Workflow">
            {workflowOccurrence ? (
              <ApprovalWorkflowMissingSectionV2
                occurrence={workflowOccurrence}
                context={workflowOccurrence.context}
                canComplete={canComplete}
                canExempt={canExempt}
                onSuccess={onClose}
              />
            ) : confirmationOccurrence?.status === 'completed' ? (
              <ApprovalWorkflowConfirmationSectionV2
                title="Mark Incomplete"
                description="This will move the requirement back to missing so it can be completed again."
                warningText="This action changes the approval status immediately."
                buttonLabel="Mark Incomplete"
                disabled={!approvalWorkflowActions.canMarkIncomplete}
                loading={approvalWorkflowActions.loading}
                onConfirm={approvalWorkflowActions.markIncomplete}
              />
            ) : confirmationOccurrence?.status === 'exempted' ? (
              <ApprovalWorkflowConfirmationSectionV2
                title="Remove Exemption"
                description="This will remove the exemption and make this requirement needed again."
                warningText="This action changes the approval status immediately."
                buttonLabel="Remove Exemption"
                disabled={!approvalWorkflowActions.canRemoveExemption}
                loading={approvalWorkflowActions.loading}
                onConfirm={approvalWorkflowActions.removeExemption}
              />
            ) : (
              <Typography color="text.secondary" variant="body2">
                Workflow actions will appear here.
              </Typography>
            )}
          </DrawerSection>

          <Divider />

          <DrawerSection title="Evidence">
            <Stack spacing={0.5}>
              <DetailField label="Documents">{evidenceItems[0]}</DetailField>
              <DetailField label="Notes">{evidenceItems[1]}</DetailField>
            </Stack>
          </DrawerSection>

        </Stack>
      )}
    </Drawer>
  );
}
