import { useState } from 'react';
import {
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
  Badge,
  Avatar,
  Divider,
  Stack,
  Typography,
  ListItemText,
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';
import { Dropdown, Shell } from '@caretogether/ui-components';

interface AppHeaderProps {
  onToggleSidebar: () => void;
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export function AppHeader({
  selectedLocation,
  onLocationChange,
  searchValue,
  onSearchChange,
}: AppHeaderProps) {
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const getLocationLabel = (value: string) => {
    switch (value) {
      case 'atlantis':
        return 'Atlantis';
      case 'central':
        return 'Central';
      case 'north':
        return 'North Campus';
      default:
        return value;
    }
  };
  const leftContent = (
    <Stack direction="row" alignItems="center" spacing={2}>
      <img src="/caretogether-logo.avif" alt="CareTogether Logo" style={{ height: 40 }} />
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      <Dropdown open={locationMenuOpen} setOpen={setLocationMenuOpen}>
        <Dropdown.Button
          size="small"
          color="inherit"
          endIcon={<KeyboardArrowDownIcon />}
          sx={{
            textTransform: 'none',
            minWidth: 120,
          }}
          aria-label="Select location"
        >
          {getLocationLabel(selectedLocation)}
        </Dropdown.Button>
        <Dropdown.Menu placement="bottom-start" closeOnItemClick>
          <MenuItem
            onClick={() => onLocationChange('atlantis')}
            selected={selectedLocation === 'atlantis'}
          >
            <ListItemText>Atlantis</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => onLocationChange('central')}
            selected={selectedLocation === 'central'}
          >
            <ListItemText>Central</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => onLocationChange('north')}
            selected={selectedLocation === 'north'}
          >
            <ListItemText>North Campus</ListItemText>
          </MenuItem>
        </Dropdown.Menu>
      </Dropdown>
    </Stack>
  );

  const centerContent = (
    <TextField
      placeholder="Search..."
      size="small"
      value={searchValue}
      onChange={e => onSearchChange(e.target.value)}
      sx={{
        width: 350,
        '& .MuiInputBase-root': {
          height: '48px',
        },
      }}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <SearchIcon />
            </InputAdornment>
          ),
        },
      }}
    />
  );

  const rightContent = (
    <Stack direction="row" alignItems="center" spacing={2}>
      <IconButton color="inherit">
        <Badge badgeContent={3} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Dropdown open={userMenuOpen} setOpen={setUserMenuOpen}>
        <Dropdown.Button
          color="inherit"
          sx={{
            textTransform: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
          endIcon={<KeyboardArrowDownIcon />}
          aria-label="User menu"
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>MM</Avatar>
          <Typography variant="body2">Meghan Macy</Typography>
        </Dropdown.Button>
        <Dropdown.Menu placement="bottom-end" closeOnItemClick>
          <MenuItem onClick={() => console.log('Profile')}>
            <ListItemText>Profile</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => console.log('Settings')}>
            <ListItemText>Settings</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => console.log('Logout')}>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Dropdown.Menu>
      </Dropdown>
    </Stack>
  );

  return (
    <Shell.Header
      leftContent={leftContent}
      centerContent={centerContent}
      rightContent={rightContent}
    />
  );
}
