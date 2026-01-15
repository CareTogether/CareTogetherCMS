import {
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
  Badge,
  Avatar,
  Divider,
  Stack,
  Button,
  Typography,
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';

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
  const leftContent = (
    <Stack direction="row" alignItems="center" spacing={2}>
      <img src="/caretogether-logo.avif" alt="CareTogether Logo" style={{ height: 40 }} />
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      <Select
        size="small"
        value={selectedLocation}
        onChange={e => onLocationChange(e.target.value)}
      >
        <MenuItem value="atlantis">Atlantis</MenuItem>
        <MenuItem value="central">Central</MenuItem>
        <MenuItem value="north">North Campus</MenuItem>
      </Select>
    </Stack>
  );

  const centerContent = (
    <TextField
      placeholder="Search..."
      size="small"
      value={searchValue}
      onChange={e => onSearchChange(e.target.value)}
      sx={{
        width: 300,
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
      <Button
        color="inherit"
        sx={{
          textTransform: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
        endIcon={<KeyboardArrowDownIcon />}
      >
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>MM</Avatar>
        <Typography variant="body2">Meghan Macy</Typography>
      </Button>
    </Stack>
  );

  return { leftContent, centerContent, rightContent };
}
