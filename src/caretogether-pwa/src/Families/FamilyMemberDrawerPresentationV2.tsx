import {
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import {
  DeleteOutlined as DeleteOutlinedIcon,
  Edit as EditIcon,
  Favorite,
  FavoriteBorder,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { type ReactNode, useId, useState } from 'react';
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
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const menuId = useId();

  const closeMenu = () => setMenuAnchor(null);
  const runAndCloseMenu = (action: () => void) => () => {
    closeMenu();
    action();
  };

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
        {(onEdit || onRemove) && (
          <IconButton
            aria-controls={menuAnchor ? menuId : undefined}
            aria-expanded={menuAnchor ? 'true' : undefined}
            aria-haspopup="true"
            aria-label={`More actions for ${copyLabel.toLowerCase()}`}
            onClick={(event) => setMenuAnchor(event.currentTarget)}
            size="small"
            sx={contactRowActionSx}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>

      <Menu
        anchorEl={menuAnchor}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        id={menuId}
        onClose={closeMenu}
        open={Boolean(menuAnchor)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      >
        {onEdit && (
          <MenuItem onClick={runAndCloseMenu(onEdit)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText className="ph-unmask">{editLabel}</ListItemText>
          </MenuItem>
        )}
        {onRemove && (
          <MenuItem
            onClick={runAndCloseMenu(onRemove)}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>
              <DeleteOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText className="ph-unmask">{removeLabel}</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
