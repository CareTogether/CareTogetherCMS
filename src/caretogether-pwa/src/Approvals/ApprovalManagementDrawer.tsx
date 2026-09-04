import CloseIcon from '@mui/icons-material/Close';
import { Box, Drawer, IconButton, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import {
  approvalRequirementManagementTitles,
  approvalRequirementName,
  type ApprovalRequirementManagementMode,
} from './approvalDetails';
import type { ApprovalLedgerOccurrence } from './approvalLedgerViewModel';

export function ApprovalManagementDrawer({
  children,
  mode,
  occurrence,
  open,
  titleId,
  onClose,
}: {
  children: ReactNode;
  mode: ApprovalRequirementManagementMode | null;
  occurrence: ApprovalLedgerOccurrence | undefined;
  open: boolean;
  titleId: string;
  onClose: () => void;
}) {
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
      {occurrence && mode && (
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
                className="ph-unmask"
                color="text.secondary"
                sx={{ textTransform: 'uppercase' }}
                variant="caption"
              >
                Requirement Management
              </Typography>
              <Typography className="ph-unmask" id={titleId} variant="h5">
                {approvalRequirementManagementTitles[mode]}
              </Typography>
              <Typography
                className="ph-unmask"
                color="text.secondary"
                variant="body2"
              >
                {approvalRequirementName(occurrence)}
              </Typography>
            </Box>
            <IconButton
              aria-label="close requirement management"
              onClick={onClose}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          {children}
        </Stack>
      )}
    </Drawer>
  );
}
