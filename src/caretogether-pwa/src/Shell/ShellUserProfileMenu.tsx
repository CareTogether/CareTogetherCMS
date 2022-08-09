import { IconButton } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export function ShellUserProfileMenu() {
  return (
    <IconButton
      size='large'
      edge='end'
      aria-label="user account"
      aria-controls='user-menu'
      aria-haspopup='true'
      //onClick={handleProfileMenuOpen}
      color='inherit'
    >
      <AccountCircleIcon />
    </IconButton>
  );
}
