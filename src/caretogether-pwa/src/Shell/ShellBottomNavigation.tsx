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
// export function Footer(props: any) {
//   const location = useLocation();
  
//   const featureFlags = useFeatureFlags();

//   const links = [/*'/dashboard',*/ '/referrals', '/volunteers'];
//   const selectedLink = links.findIndex(link => location.pathname.startsWith(link));

//   const [drawerOpen, setDrawerOpen] = useState(false);
//   const theme = useTheme();

//   return (
//     <>
//       <BottomNavigation
//         value={selectedLink}
//         showLabels
//         sx={{
//           width: '100%',
//           position: 'fixed',
//           bottom: 0,
//           backgroundColor: theme.palette.grey[300]
//         }}
//       >
//         <BottomNavigationAction icon={<MenuIcon />} onClick={() => setDrawerOpen(true)} />
//         {/* <BottomNavigationAction component={Link} to='/dashboard' label="Dashboard" icon={<DashboardIcon />} /> */}
//         {featureFlags?.viewReferrals && <BottomNavigationAction component={Link} to='/referrals' label="Referrals" icon={<PermPhoneMsgIcon />} />}
//         <BottomNavigationAction component={Link} to='/volunteers' label="Volunteers" icon={<PeopleIcon />} />
//       </BottomNavigation>
//       <Drawer
//         sx={{ zIndex: theme.zIndex.drawer + 2, '& .MuiDrawer-paper': { padding: 2 }}}
//         open={drawerOpen}
//         onClose={() => setDrawerOpen(false)}
//       >
//         {/* <LocationSwitcher /> */}
//         <Copyright />
//       </Drawer>
//     </>
//   );
// }
