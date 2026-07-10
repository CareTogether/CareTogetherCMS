import {
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type {
  CompletedRequirementInfo,
  ExemptedRequirementInfo,
  RequirementDefinition,
} from '../GeneratedClient';
import { CompletedRequirementRow } from '../Requirements/CompletedRequirementRow';
import { ExemptedRequirementRow } from '../Requirements/ExemptedRequirementRow';
import { MissingRequirementRow } from '../Requirements/MissingRequirementRow';
import {
  ApprovalLedgerOccurrence,
  ApprovalLedgerOccurrenceStatus,
  ApprovalLedgerRow,
  ApprovalLedgerStatus,
} from './approvalLedgerViewModel';

type ApprovalDetailsDrawerProps = {
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

const occurrenceStatusLabels: Record<ApprovalLedgerOccurrenceStatus, string> = {
  missing: 'Missing',
  completed: 'Completed',
  exempted: 'Exempted',
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

function occurrenceStatusColor(status: ApprovalLedgerOccurrenceStatus) {
  switch (status) {
    case 'missing':
      return 'error';
    case 'availableApplication':
      return 'info';
    case 'completed':
      return 'success';
    case 'exempted':
    default:
      return 'default';
  }
}

function scopeLabel(scope: 'family' | 'person') {
  return scope === 'family' ? 'Family' : 'Person';
}

function renderOccurrenceWorkflow(occurrence: ApprovalLedgerOccurrence) {
  switch (occurrence.status) {
    case 'completed':
      return (
        <CompletedRequirementRow
          requirement={occurrence.requirement as CompletedRequirementInfo}
          context={occurrence.context}
        />
      );
    case 'exempted':
      return (
        <ExemptedRequirementRow
          requirement={occurrence.requirement as ExemptedRequirementInfo}
          context={occurrence.context}
        />
      );
    case 'availableApplication':
    case 'missing':
      return (
        <MissingRequirementRow
          requirement={occurrence.requirement as string | RequirementDefinition}
          policyVersions={occurrence.policyVersions}
          context={occurrence.context}
          isAvailableApplication={occurrence.isAvailableApplication}
          v1CaseId={occurrence.v1CaseId}
        />
      );
    default:
      return null;
  }
}

export function ApprovalDetailsDrawer({
  row,
  open,
  onClose,
}: ApprovalDetailsDrawerProps) {
  return (
    <Drawer
      anchor="right"
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
              <Typography color="text.secondary" variant="caption">
                Approval Details
              </Typography>
              <Typography className="ph-unmask" variant="h6">
                {row.requirementName}
              </Typography>
              <Chip
                size="small"
                color={statusColor(row.status)}
                label={statusLabels[row.status]}
                sx={{ mt: 1 }}
              />
            </Box>
            <IconButton aria-label="close approval details" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider />

          <Stack spacing={1}>
            <Typography variant="subtitle2">Applies To</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {row.appliesTo.map((subject) => (
                <Chip
                  key={`${subject.scope}:${subject.id}`}
                  className="ph-unmask"
                  size="small"
                  variant="outlined"
                  label={subject.label}
                />
              ))}
            </Box>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle2">Needed For Roles</Typography>
            {row.neededForRoles.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                None
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {row.neededForRoles.map((role) => (
                  <Chip key={role} size="small" variant="outlined" label={role} />
                ))}
              </Box>
            )}
          </Stack>

          <Divider />

          <Stack spacing={1}>
            <Typography variant="subtitle2">Occurrences</Typography>
            {row.occurrences.map((occurrence) => (
              <Box
                key={occurrence.id}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1,
                }}
              >
                <Stack spacing={1}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                    }}
                  >
                    <Typography className="ph-unmask" variant="body2">
                      {occurrence.subject.label}
                    </Typography>
                    <Chip
                      size="small"
                      color={occurrenceStatusColor(occurrence.status)}
                      label={occurrenceStatusLabels[occurrence.status]}
                    />
                  </Box>
                  <Typography color="text.secondary" variant="caption">
                    {scopeLabel(occurrence.subject.scope)} scoped
                  </Typography>
                  <Box
                    sx={{
                      '& > div:first-of-type': {
                        marginLeft: 0,
                      },
                    }}
                  >
                    <Typography variant="subtitle2">Actions</Typography>
                    {renderOccurrenceWorkflow(occurrence)}
                  </Box>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Stack>
      )}
    </Drawer>
  );
}
