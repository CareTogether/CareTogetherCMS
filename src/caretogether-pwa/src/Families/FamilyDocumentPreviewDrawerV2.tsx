import {
  Box,
  Alert,
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
  DeleteOutlined as DeleteIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { FamilyDocumentRowV2 } from './familyDocumentsViewModelV2';
import { v2Typography } from './v2Typography';
import { useId } from 'react';

type FamilyDocumentPreviewDrawerV2Props = {
  error?: string;
  loading?: boolean;
  onClose: () => void;
  onDownload?: (row: FamilyDocumentRowV2) => void;
  onDelete?: (row: FamilyDocumentRowV2) => void;
  onExited?: () => void;
  downloadError?: string;
  previewUrl?: string;
  row: FamilyDocumentRowV2 | null;
};

export function FamilyDocumentPreviewDrawerV2({
  error,
  loading = false,
  onClose,
  onDownload,
  onDelete,
  onExited,
  downloadError,
  previewUrl,
  row,
}: FamilyDocumentPreviewDrawerV2Props) {
  const titleId = useId();
  const canPreview = Boolean(
    row?.permissionFlags.canPreview && row.uploadedDocumentId
  );
  return (
    <Drawer
      anchor="right"
      open={row !== null}
      onClose={onClose}
      slotProps={{
        transition: { onExited },
        paper: {
          role: 'dialog',
          'aria-labelledby': titleId,
          sx: {
            width: { xs: '100%', md: 760 },
            maxWidth: '100%',
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
              flexWrap: 'wrap',
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                {...v2Typography.workspaceTitle}
                id={titleId}
                sx={{ overflowWrap: 'anywhere' }}
              >
                {row.documentName}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {row.sourceLabel}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                gap: 0.5,
                flexWrap: 'wrap',
                '& .MuiIconButton-root': {
                  minWidth: { xs: 48, lg: 0 },
                  minHeight: { xs: 48, lg: 0 },
                },
              }}
            >
              {previewUrl && canPreview && row.permissionFlags.canDownload && (
                <Tooltip title="Open in new tab">
                  <IconButton
                    aria-label={`Open ${row.documentName} in a new tab`}
                    component="a"
                    href={previewUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                    size="small"
                  >
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {onDownload &&
                row.permissionFlags.canDownload &&
                row.uploadedDocumentId && (
                  <Tooltip title="Download">
                    <IconButton
                      aria-label={`Download ${row.documentName}`}
                      onClick={() => onDownload(row)}
                      size="small"
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              {onDelete &&
                row.source.type === 'family' &&
                row.permissionFlags.canDelete &&
                row.uploadedDocumentId && (
                  <Tooltip title="Delete">
                    <IconButton
                      aria-label={`Delete ${row.documentName}`}
                      onClick={() => onDelete(row)}
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
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
              component="dl"
              sx={{
                m: 0,
                mb: 2,
                display: 'grid',
                gridTemplateColumns: 'max-content minmax(0, 1fr)',
                columnGap: 2,
                rowGap: 1,
                '& dd': { m: 0, overflowWrap: 'anywhere' },
              }}
            >
              {[
                { label: 'Upload date', value: row.uploadDateLabel },
                {
                  label: 'Uploaded by',
                  value: row.uploadedByLabel ?? row.uploadedByUserId,
                },
                {
                  label: 'Source',
                  value: row.sourceType === 'family' ? 'Family' : 'Referral',
                },
                { label: 'File type', value: row.fileTypeLabel },
                { label: 'Referral', value: row.referralTitle },
              ].map(({ label, value }) =>
                value ? (
                  <Box key={label} sx={{ display: 'contents' }}>
                    <Typography
                      component="dt"
                      variant="body2"
                      className="ph-unmask"
                    >
                      {label}
                    </Typography>
                    <Typography component="dd" variant="body2">
                      {value}
                    </Typography>
                  </Box>
                ) : null
              )}
            </Box>
            {downloadError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {downloadError}
              </Alert>
            )}
            <Box
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.default',
                height: canPreview ? '100%' : 'auto',
                minHeight: canPreview ? 320 : undefined,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {!canPreview && !error && (
                <Typography
                  color="text.secondary"
                  variant="body2"
                  sx={{ p: 2 }}
                >
                  Preview is unavailable for this document.
                </Typography>
              )}
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

              {!loading &&
                !error &&
                canPreview &&
                previewUrl &&
                row.previewKind === 'image' && (
                  <Box
                    component="img"
                    src={previewUrl}
                    alt=""
                    sx={{
                      display: 'block',
                      height: '100%',
                      objectFit: 'contain',
                      width: '100%',
                    }}
                  />
                )}

              {/* No sandbox: Chrome refuses to run its PDF viewer in a sandboxed frame. */}
              {!loading &&
                !error &&
                canPreview &&
                previewUrl &&
                row.previewKind === 'pdf' && (
                  <Box
                    component="iframe"
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
