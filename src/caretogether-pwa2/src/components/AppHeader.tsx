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
  Box,
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  KeyboardArrowDownRounded as KeyboardArrowDownIcon,
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
    <Stack direction="row" alignItems="center" gap={1.5}>
      <Stack alignItems="center" direction="row">
        <img src="/caretogether-logo.avif" alt="CareTogether Logo" style={{ height: 23 }} />
      </Stack>
      <Divider orientation="vertical" flexItem sx={{ height: 30 }} />
      <Dropdown open={locationMenuOpen} setOpen={setLocationMenuOpen}>
        <Dropdown.Button
          size="small"
          color="primaryDark"
          endIcon={<KeyboardArrowDownIcon sx={{ ml: -0.5 }} />}
          sx={{
            px: 1.5,
            ml: -1,
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
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <IconButton color="tertiary" aria-label="Notifications">
        <Badge badgeContent={3} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Dropdown open={userMenuOpen} setOpen={setUserMenuOpen}>
        <Dropdown.Button
          color="tertiary"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            '& .MuiButton-icon': { margin: 0 },
          }}
          endIcon={<KeyboardArrowDownIcon />}
          aria-label="User menu"
        >
          <Avatar sx={{ bgcolor: 'tertiary.main' }}>MM</Avatar>
          <Box component="span" textAlign="left">
            <Typography variant="body1" lineHeight={1.15}>
              Meghan Macy
            </Typography>
            <Typography color="grey.900" variant="body2" lineHeight={1.15}>
              Intake coordinator
            </Typography>
          </Box>
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
