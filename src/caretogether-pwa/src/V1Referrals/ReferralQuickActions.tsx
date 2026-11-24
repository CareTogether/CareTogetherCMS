import { Box, Button, useMediaQuery, useTheme } from '@mui/material';
import { CloudUpload, NoteAddOutlined } from '@mui/icons-material';

type ReferralQuickActionsProps = {
  canAddNotes: boolean;
  canUploadDocuments: boolean;
  onAddNote: () => void;
  onUploadDocuments: () => void;
};

export function ReferralQuickActions({
  canAddNotes,
  canUploadDocuments,
  onAddNote,
  onUploadDocuments,
}: ReferralQuickActionsProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  if (isDesktop || (!canAddNotes && !canUploadDocuments)) return null;

  return (
    <Box
      sx={{
        width: '100%',
        '--referral-action-dock-height': `calc(48px + ${theme.spacing(1)} + 1px)`,
        height:
          'max(0px, calc(var(--shell-bottom-navigation-height, 0px) + var(--referral-action-dock-height) - var(--shell-bottom-clearance, 0px)))',
      }}
    >
      <Box
        role="toolbar"
        aria-label="Referral quick actions"
        sx={{
          position: 'fixed',
          bottom: 'var(--shell-bottom-navigation-height, 0px)',
          insetInlineStart: 'var(--shell-content-inline-offset, 0px)',
          insetInlineEnd: 0,
          height: 'var(--referral-action-dock-height)',
          boxSizing: 'border-box',
          borderTop: 1,
          borderColor: 'divider',
          zIndex: theme.zIndex.appBar - 1,
          display: 'flex',
          justifyContent: 'center',
          bgcolor: 'background.paper',
          gap: 1,
          py: 0.5,
          pl: {
            xs: `max(${theme.spacing(2)}, env(safe-area-inset-left))`,
            sm: `max(${theme.spacing(3)}, env(safe-area-inset-left))`,
          },
          pr: {
            xs: `max(${theme.spacing(2)}, env(safe-area-inset-right))`,
            sm: `max(${theme.spacing(3)}, env(safe-area-inset-right))`,
          },
          '& .MuiButton-root': {
            flex: '0 0 auto',
            minHeight: 48,
            px: 1.5,
            whiteSpace: 'nowrap',
          },
        }}
      >
        {canAddNotes && (
          <Button
            className="ph-unmask"
            variant="contained"
            size="small"
            disableElevation
            startIcon={<NoteAddOutlined />}
            onClick={onAddNote}
          >
            Add Note
          </Button>
        )}
        {canUploadDocuments && (
          <Button
            className="ph-unmask"
            aria-label="Upload Document"
            variant="contained"
            size="small"
            disableElevation
            startIcon={<CloudUpload />}
            onClick={onUploadDocuments}
          >
            Upload
          </Button>
        )}
      </Box>
    </Box>
  );
}
