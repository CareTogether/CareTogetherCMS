import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { policyDraftStatus } from './policyDraftStatus';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useEffect, useRef, useState } from 'react';

export function PolicyGridDraftActions({
  changeCount,
  saving,
  editing,
  error,
  saveSuccessId,
  onSave,
  onCancel,
}: {
  changeCount: number;
  saving: boolean;
  editing?: boolean;
  error?: string;
  saveSuccessId?: number;
  onSave: () => void;
  onCancel: () => void;
}) {
  const dirty = changeCount > 0;
  const [recentSave, setRecentSave] = useState<number>();
  const consumedSave = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (saveSuccessId === undefined || dirty || saving || editing || error) {
      setRecentSave(undefined);
      return;
    }
    if (consumedSave.current === saveSuccessId) return;
    consumedSave.current = saveSuccessId;
    setRecentSave(saveSuccessId);
  }, [saveSuccessId, dirty, saving, editing, error]);
  useEffect(() => {
    if (recentSave === undefined) return;
    const timer = window.setTimeout(() => setRecentSave(undefined), 3000);
    return () => window.clearTimeout(timer);
  }, [recentSave]);
  const status = policyDraftStatus({
    changeCount,
    saving,
    editing,
    error,
    saved: recentSave !== undefined && recentSave === saveSuccessId,
  });
  return (
    <Stack spacing={1}>
      {error && <Alert severity="error">{error}</Alert>}
      <Box
        sx={{
          p: 1.5,
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Stack
          direction="row"
          useFlexGap
          spacing={1.5}
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <Stack
            direction="row"
            spacing={0.75}
            sx={{
              alignItems: 'center',
              minWidth: 0,
              minHeight: 20,
              flexBasis: { xs: '100%', sm: 'auto' },
            }}
          >
            <Box sx={{ width: 18, height: 18, flexShrink: 0 }}>
              {status.kind === 'saving' ? (
                <CircularProgress
                  size={18}
                  aria-label="Saving policy changes"
                />
              ) : status.kind === 'saved' ? (
                <CheckCircleOutlineIcon
                  sx={{ fontSize: 18, color: 'success.main' }}
                />
              ) : status.kind === 'error' ? (
                <ErrorOutlineIcon sx={{ fontSize: 18, color: 'error.main' }} />
              ) : status.kind !== 'clean' ? (
                <EditOutlinedIcon
                  sx={{ fontSize: 18, color: 'text.secondary' }}
                />
              ) : null}
            </Box>
            <Typography
              role="status"
              aria-label="Policy draft status"
              aria-live="polite"
              aria-atomic="true"
              variant="body2"
              sx={{ fontWeight: 500 }}
            >
              {status.text || '\u00a0'}
            </Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              ml: 'auto',
              flexShrink: 0,
              '& .MuiButton-root': { minHeight: 40 },
            }}
          >
            <Button
              variant="outlined"
              color="inherit"
              disabled={!dirty || saving}
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disableElevation
              loading={saving}
              loadingPosition="start"
              startIcon={<SaveOutlinedIcon />}
              disabled={!dirty || saving || editing}
              onClick={onSave}
              sx={{
                minWidth: 124,
                whiteSpace: 'nowrap',
                px: { xs: 1, sm: 2 },
                '& .MuiButton-startIcon': {
                  display: { xs: 'none', sm: 'inherit' },
                },
              }}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}
