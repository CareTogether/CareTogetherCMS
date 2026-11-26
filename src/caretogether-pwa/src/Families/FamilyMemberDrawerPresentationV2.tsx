import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import {
  DeleteOutlined as DeleteOutlinedIcon,
  Edit as EditIcon,
  Favorite,
  FavoriteBorder,
} from '@mui/icons-material';
import { type ReactNode } from 'react';
import { useGlobalSnackBar } from '../Hooks/useGlobalSnackBar';
import { ContactInfoCopyButton } from './ContactInfoCopyButton';
import { v2Typography } from './v2Typography';

export function FamilyMemberDrawerSectionV2({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <Stack
      spacing={1}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        p: 1.5,
      }}
    >
      <Box>
        <Typography variant="subtitle2">{title}</Typography>
        {description && (
          <Typography color="text.secondary" variant="caption">
            {description}
          </Typography>
        )}
      </Box>
      {children}
    </Stack>
  );
}

export function FamilyMemberDrawerEmptyStateV2({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Typography color="text.secondary" variant="body2">
      {children}
    </Typography>
  );
}

export function FamilyMemberDrawerDetailFieldV2({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <Box>
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography component="div" {...v2Typography.primaryValue}>
        {children || '-'}
      </Typography>
    </Box>
  );
}

const contactRowActionSx = { height: 44, width: 44 };

export function FamilyMemberDrawerContactRowV2({
  children,
  copyLabel,
  copyValue,
  editLabel,
  isPreferred,
  onEdit,
  onRemove,
  removeLabel,
  type,
}: {
  children: ReactNode;
  copyLabel: string;
  copyValue: string;
  editLabel: string;
  isPreferred: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
  removeLabel: string;
  type: string;
}) {
  const { setAndShowGlobalSnackBar } = useGlobalSnackBar();

  return (
    <Box
      sx={{
        alignItems: 'center',
        columnGap: 1,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        minWidth: 0,
        py: 0.25,
      }}
    >
      <Box
        sx={{
          alignItems: 'start',
          columnGap: 1,
          display: 'grid',
          gridTemplateColumns: '20px minmax(0, 1fr)',
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            color: 'text.disabled',
            display: 'flex',
            pt: 0.25,
          }}
        >
          {isPreferred ? (
            <Favorite aria-hidden="true" fontSize="small" />
          ) : (
            <FavoriteBorder aria-hidden="true" fontSize="small" />
          )}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              lineHeight: 1.35,
              overflowWrap: 'anywhere',
            }}
          >
            {children}
          </Typography>
          <Typography color="text.secondary" variant="caption">
            {type}
            {isPreferred && ' · Preferred'}
          </Typography>
        </Box>
      </Box>

      <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
        <ContactInfoCopyButton
          label={copyLabel}
          onCopied={setAndShowGlobalSnackBar}
          sx={contactRowActionSx}
          value={copyValue}
        />
        {onEdit && (
          <Tooltip enterDelay={800} title={editLabel}>
            <IconButton
              aria-label={editLabel}
              onClick={onEdit}
              size="small"
              sx={contactRowActionSx}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {onRemove && (
          <Tooltip title={removeLabel}>
            <IconButton
              aria-label={removeLabel}
              color="error"
              onClick={onRemove}
              size="small"
              sx={contactRowActionSx}
            >
              <DeleteOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Box>
  );
}
