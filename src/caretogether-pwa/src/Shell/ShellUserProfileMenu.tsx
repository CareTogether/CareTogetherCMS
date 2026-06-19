import { MouseEvent, useState } from 'react';
import {
  AccountCircle as AccountCircleIcon,
  Science as ScienceIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from '@mui/material';
import { logoutAsync } from '../Authentication/Auth';
import { useScopedTrace } from '../Hooks/useScopedTrace';
import { EarlyAccessFeaturesDialog } from './EarlyAccessFeaturesDialog';

export function ShellUserProfileMenu() {
  const trace = useScopedTrace('ShellUserProfileMenu');
  const [anchorElement, setAnchorElement] = useState<null | HTMLElement>(null);
  const [betaFeaturesOpen, setBetaFeaturesOpen] = useState(false);
  const open = Boolean(anchorElement);

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorElement(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorElement(null);
  };

  const handleLogoutClick = async () => {
    handleMenuClose();

    try {
      await logoutAsync();
    } catch (error) {
      trace(`Failed to sign out. Error: ${error}`);
    }
  };

  const handleBetaFeaturesClick = () => {
    handleMenuClose();
    setBetaFeaturesOpen(true);
  };

  return (
    <>
      <IconButton
        size="large"
        edge="end"
        aria-label="user account"
        aria-controls={open ? 'user-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleMenuOpen}
        color="inherit"
      >
        <AccountCircleIcon />
      </IconButton>
      <Menu
        id="user-menu"
        anchorEl={anchorElement}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleBetaFeaturesClick}>
          <ListItemIcon>
            <ScienceIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Beta Features</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleLogoutClick}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Log out</ListItemText>
        </MenuItem>
      </Menu>
      <EarlyAccessFeaturesDialog
        open={betaFeaturesOpen}
        onClose={() => setBetaFeaturesOpen(false)}
      />
    </>
  );
}
