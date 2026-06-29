import CloseIcon from '@mui/icons-material/Close';
import { Box, Drawer, IconButton, Stack, Typography } from '@mui/material';
import { Permission } from '../GeneratedClient';
import { useFamilyIdPermissions } from '../Model/SessionModel';
import type { ApprovalLedgerOccurrence } from './approvalLedgerViewModel';
import { ApprovalWorkflowMissingSectionV2 } from './ApprovalWorkflowMissingSectionV2';

export type RequirementManagementMode = 'complete' | 'grantExemption';

type RequirementManagementDrawerV2Props = {
  mode: RequirementManagementMode | null;
  occurrence: ApprovalLedgerOccurrence | undefined;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

const requirementManagementContent: Record<
  RequirementManagementMode,
  { title: string }
> = {
  complete: {
    title: 'Complete',
  },
  grantExemption: {
    title: 'Exempt',
  },
};

function familyIdFromOccurrence(
  occurrence: ApprovalLedgerOccurrence | undefined
) {
  if (
    occurrence?.context.kind === 'Volunteer Family' ||
    occurrence?.context.kind === 'Individual Volunteer'
  ) {
    return occurrence.context.volunteerFamilyId;
  }

  return '';
}

function requirementNameFromOccurrence(
  occurrence: ApprovalLedgerOccurrence | undefined
) {
  if (!occurrence) {
    return '';
  }

  if (typeof occurrence.requirement === 'string') {
    return occurrence.requirement;
  }

  if ('actionName' in occurrence.requirement) {
    return occurrence.requirement.actionName;
  }

  return occurrence.requirement.requirementName;
}

export function RequirementManagementDrawerV2({
  mode,
  occurrence,
  open,
  onClose,
  onSuccess,
}: RequirementManagementDrawerV2Props) {
  const content = mode ? requirementManagementContent[mode] : undefined;
  const permissions = useFamilyIdPermissions(
    familyIdFromOccurrence(occurrence)
  );

  return (
    <Drawer
      anchor="right"
      aria-labelledby="requirement-management-title"
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
      {occurrence && content && mode && (
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
                Requirement Management
              </Typography>
              <Typography id="requirement-management-title" variant="h5">
                {content.title}
              </Typography>
              <Typography
                className="ph-unmask"
                color="text.secondary"
                variant="body2"
              >
                {requirementNameFromOccurrence(occurrence)}
              </Typography>
            </Box>
            <IconButton
              aria-label="close requirement management"
              onClick={onClose}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <ApprovalWorkflowMissingSectionV2
            occurrence={occurrence}
            context={occurrence.context}
            canComplete={
              mode === 'complete' &&
              permissions(Permission.EditApprovalRequirementCompletion)
            }
            canExempt={
              mode === 'grantExemption' &&
              permissions(Permission.EditApprovalRequirementExemption)
            }
            mode={mode}
            onSuccess={onSuccess ?? onClose}
          />
        </Stack>
      )}
    </Drawer>
  );
}
