import {
  Box,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { FamilyDocumentRowV2 } from './familyDocumentsViewModelV2';
import { v2Typography } from './v2Typography';

type FamilyDocumentPreviewDrawerV2Props = {
  error?: string;
  loading?: boolean;
  onClose: () => void;
  onDownload?: (row: FamilyDocumentRowV2) => void;
  previewUrl?: string;
  row: FamilyDocumentRowV2 | null;
};

export function FamilyDocumentPreviewDrawerV2({
  error,
  loading = false,
  onClose,
  onDownload,
  previewUrl,
  row,
}: FamilyDocumentPreviewDrawerV2Props) {
  return (
    <Drawer
      anchor="right"
      open={row !== null}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', md: 760 },
            top: 45,
            height: 'calc(100% - 45px)',
            display: 'flex',
          },
        },
      }}
    >
      {row && (
        <>
          <Box
            sx={{
              alignItems: 'flex-start',
              display: 'flex',
              gap: 2,
              justifyContent: 'space-between',
              p: 2,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography {...v2Typography.workspaceTitle} noWrap>
                {row.documentName}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {row.sourceLabel}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {onDownload && row.permissionFlags.canDownload && (
                <Tooltip title="Download">
                  <IconButton
                    className="ph-unmask"
                    aria-label={`Download ${row.documentName}`}
                    onClick={() => onDownload(row)}
                    size="small"
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <IconButton
                className="ph-unmask"
                aria-label="Close document preview"
                onClick={onClose}
                size="small"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Divider />

          <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 2 }}>
            <Box
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.default',
                height: { xs: 420, md: 560 },
                minHeight: 320,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {loading && (
                <Box
                  sx={{
                    alignItems: 'center',
                    display: 'flex',
                    height: '100%',
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress size={28} />
                </Box>
              )}

              {!loading && error && (
                <Box
                  sx={{
                    alignItems: 'center',
                    display: 'flex',
                    height: '100%',
                    justifyContent: 'center',
                    p: 3,
                    textAlign: 'center',
                  }}
                >
                  <Typography color="text.secondary" variant="body2">
                    {error}
                  </Typography>
                </Box>
              )}

              {!loading && !error && previewUrl && (
                <Box
                  component="iframe"
                  sandbox="allow-same-origin"
                  src={previewUrl}
                  title="Document preview"
                  sx={{
                    border: 0,
                    height: '100%',
                    width: '100%',
                  }}
                />
              )}
            </Box>
          </Box>
        </>
      )}
    </Drawer>
  );
}
