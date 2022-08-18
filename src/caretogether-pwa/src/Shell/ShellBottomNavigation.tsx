// import { useState } from 'react';
import { BottomNavigation, BottomNavigationAction, Paper, useTheme } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PermPhoneMsgIcon from '@mui/icons-material/PermPhoneMsg';
// import DashboardIcon from '@mui/icons-material/Dashboard';
// import MenuIcon from '@mui/icons-material/Menu';
import { useFeatureFlags } from '../Model/ConfigurationModel';
import { Link, useLocation } from 'react-router-dom';

export function ShellBottomNavigation() {
  const theme = useTheme();
  
  const location = useLocation();
  
  const featureFlags = useFeatureFlags();

  const links = [/*'/dashboard',*/ '/referrals', '/volunteers'];
  const selectedLink = links.findIndex(link => location.pathname.startsWith(link));
  //   const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Paper elevation={3} sx={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0
    }}>
      <BottomNavigation
        showLabels
        value={selectedLink}
        // onChange={(event, newValue) => {
        //   setValue(newValue);
        // }}
//         sx={{
//           width: '100%',
//           position: 'fixed',
//           bottom: 0,
//           backgroundColor: theme.palette.grey[300]
//         }}
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
        {/* <BottomNavigationAction icon={<MenuIcon />} onClick={() => setDrawerOpen(true)} /> */}
        {/* <BottomNavigationAction component={Link} to='/dashboard' label="Dashboard" icon={<DashboardIcon />} /> */}
        {featureFlags?.viewReferrals && <BottomNavigationAction component={Link} to='/referrals' label="Referrals" icon={<PermPhoneMsgIcon />} />}
        <BottomNavigationAction component={Link} to='/volunteers' label="Volunteers" icon={<PeopleIcon />} />
      </BottomNavigation>
    </Paper>
  );
}

//       <Drawer
//         sx={{ zIndex: theme.zIndex.drawer + 2, '& .MuiDrawer-paper': { padding: 2 }}}
//         open={drawerOpen}
//         onClose={() => setDrawerOpen(false)}
//       >
//         {/* <LocationSwitcher /> */}
//         <Copyright />
//       </Drawer>
