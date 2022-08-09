import { useState } from 'react';
import { BottomNavigation, BottomNavigationAction, Paper, useTheme } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocationOnIcon from '@mui/icons-material/LocationOn';

export function ShellBottomNavigation() {
  const theme = useTheme();
  const [value, setValue] = useState(0);

  return (
    <Paper elevation={3} sx={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0
    }}>
      <BottomNavigation
        showLabels
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
        }}
        sx={{
          backgroundColor: theme.palette.primary.dark,
          '.MuiBottomNavigationAction-root': {
            color: theme.palette.primary.contrastText
          },
          '& .MuiBottomNavigationAction-root.Mui-selected': {
            color: theme.palette.secondary.main
          }
        }}
      >
        <BottomNavigationAction label="Recents" icon={<RestoreIcon />} />
        <BottomNavigationAction label="Favorites" icon={<FavoriteIcon />} />
        <BottomNavigationAction label="Nearby" icon={<LocationOnIcon />} />
      </BottomNavigation>
    </Paper>
  );
}
