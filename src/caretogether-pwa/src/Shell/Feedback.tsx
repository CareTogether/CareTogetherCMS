import React from 'react';
import {
  Box,
  Popover,
  MenuList,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import BugReportIcon from '@mui/icons-material/BugReport';
import Button from '@mui/material/Button';
import { Permission } from '../GeneratedClient';
import { useGlobalPermissions } from '../Model/SessionModel';

export default function Feedback() {
  const permissions = useGlobalPermissions();
  const hasAccessToSupport = permissions(Permission.AccessSupportScreen);

  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Button
        disableRipple
        variant="contained"
        onClick={handleOpen}
        sx={{
          position: 'relative',
          borderRadius: '50px 50px 50px 0',
          backgroundColor: '#fff',
          color: (theme) => theme.palette.primary.main,
          fontWeight: 'bold',
          fontSize: '0.95rem',
          px: 3,
          py: 1.2,
          boxShadow: 4,
          textTransform: 'none',
          transition: 'all 0.2s ease',
          '&:after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            right: 18,
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderTop: '10px solid #fff',
            pointerEvents: 'none',
          },
          '&:hover': {
            backgroundColor: '#f5f5f5',
            boxShadow: 6,
            transform: 'translateY(-2px)',
          },
        }}
      >
        Need Help?
      </Button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        slotProps={{
          paper: { sx: { borderRadius: 2, boxShadow: 4, minWidth: 200 } },
        }}
      >
        <MenuList dense>
          <MenuItem
            onClick={() => {
              handleClose();
              window.open(
                'https://caretogether.featurebase.app/',
                '_blank',
                'noopener,noreferrer'
              );
            }}
          >
            <ListItemIcon>
              <StarBorderIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Request feature" />
          </MenuItem>

          {hasAccessToSupport && (
            <MenuItem
              onClick={() => {
                handleClose();
                if (window.Featurebase) window.Featurebase('showNewMessage');
              }}
            >
              <ListItemIcon>
                <BugReportIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="I have a problem" />
            </MenuItem>
          )}
        </MenuList>
      </Popover>
    </Box>
  );
}
