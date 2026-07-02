import CloseIcon from '@mui/icons-material/Close';
import { Box, Drawer, IconButton, Stack, Typography } from '@mui/material';
import { StartArrangementDialog } from './StartArrangementDialog';
import { EndArrangementDialog } from './EndArrangementDialog';
import { CancelArrangementDialog } from './CancelArrangementDialog';
import { ReopenArrangementDialog } from './ReopenArrangementDialog';
import { DeleteArrangementDialog } from './DeleteArrangementDialog';
import type { ArrangementRowV2 } from './arrangementViewModel';

export type ArrangementManagementMode =
  | 'start'
  | 'end'
  | 'cancel'
  | 'reopen'
  | 'delete';

type ArrangementManagementDrawerV2Props = {
  mode: ArrangementManagementMode | null;
  row: ArrangementRowV2 | null;
  open: boolean;
  onClose: () => void;
};

const modeTitles: Record<ArrangementManagementMode, string> = {
  start: 'Start Arrangement',
  end: 'End Arrangement',
  cancel: 'Cancel Arrangement',
  reopen: 'Reopen Arrangement',
  delete: 'Delete Arrangement',
};

function ArrangementLifecycleDialog({
  mode,
  row,
  onClose,
}: {
  mode: ArrangementManagementMode;
  row: ArrangementRowV2;
  onClose: () => void;
}) {
  const arrangement = row.source;
  const v1CaseId = row.v1Case.id!;

  if (mode === 'start') {
    return (
      <StartArrangementDialog
        arrangement={arrangement}
        onClose={onClose}
        v1CaseId={v1CaseId}
      />
    );
  }

  if (mode === 'end') {
    return (
      <EndArrangementDialog
        arrangement={arrangement}
        onClose={onClose}
        v1CaseId={v1CaseId}
      />
    );
  }

  if (mode === 'cancel') {
    return (
      <CancelArrangementDialog
        arrangement={arrangement}
        onClose={onClose}
        v1CaseId={v1CaseId}
      />
    );
  }

  if (mode === 'reopen') {
    return (
      <ReopenArrangementDialog
        arrangement={arrangement}
        onClose={onClose}
        v1CaseId={v1CaseId}
      />
    );
  }

  return (
    <DeleteArrangementDialog
      arrangement={arrangement}
      onClose={onClose}
      v1CaseId={v1CaseId}
    />
  );
}

export function ArrangementManagementDrawerV2({
  mode,
  row,
  open,
  onClose,
}: ArrangementManagementDrawerV2Props) {
  return (
    <>
      <Drawer
        anchor="right"
        aria-labelledby="arrangement-management-title"
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
        {mode && row && (
          <Stack spacing={2}>
            <Box
              sx={{
                alignItems: 'flex-start',
                display: 'flex',
                gap: 1,
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  color="text.secondary"
                  sx={{ textTransform: 'uppercase' }}
                  variant="caption"
                >
                  Arrangement Management
                </Typography>
                <Typography
                  id="arrangement-management-title"
                  className="ph-unmask"
                  variant="h5"
                >
                  {modeTitles[mode]}
                </Typography>
                <Typography
                  className="ph-unmask"
                  color="text.secondary"
                  variant="body2"
                >
                  {row.arrangementType} for {row.childOrPersonLabel}
                </Typography>
              </Box>
              <IconButton
                aria-label="close arrangement management"
                onClick={onClose}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Stack>
        )}
      </Drawer>
      {open && mode && row && (
        <ArrangementLifecycleDialog mode={mode} row={row} onClose={onClose} />
      )}
    </>
  );
}
