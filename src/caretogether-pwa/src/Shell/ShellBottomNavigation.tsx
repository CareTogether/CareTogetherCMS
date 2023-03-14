import { useState } from 'react';
import { BottomNavigation, BottomNavigationAction, Drawer, Paper, useTheme } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PermPhoneMsgIcon from '@mui/icons-material/PermPhoneMsg';
import Diversity3Icon from '@mui/icons-material/Diversity3';
// import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuIcon from '@mui/icons-material/Menu';
import { useFeatureFlags } from '../Model/ConfigurationModel';
import { Link, useLocation } from 'react-router-dom';
import { ShellContextSwitcher } from './ShellContextSwitcher';

export function ShellBottomNavigation() {
  const theme = useTheme();
  
  const location = useLocation();
  
  const featureFlags = useFeatureFlags();

  const links = [/*'/dashboard',*/ '/referrals', '/volunteers'];
  const selectedLink = links.findIndex(link => location.pathname.startsWith(link));
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Paper elevation={3} sx={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
	  zIndex: 9999
    }}>
      <BottomNavigation
        showLabels
        value={selectedLink}
        sx={{
          // width: '100%',
          // position: 'fixed',
          // bottom: 0,
          // backgroundColor: theme.palette.grey[300],
          backgroundColor: theme.palette.primary.dark,
          '.MuiBottomNavigationAction-root': {
            color: theme.palette.primary.contrastText
          },
          '& .MuiBottomNavigationAction-root.Mui-selected': {
            color: theme.palette.secondary.main
          }
        }}
      >
        <BottomNavigationAction icon={<MenuIcon />} onClick={() => setDrawerOpen(true)} />
        {/* <BottomNavigationAction component={Link} to='/dashboard' label="Dashboard" icon={<DashboardIcon />} /> */}
        {featureFlags?.viewReferrals && <BottomNavigationAction component={Link} to='/referrals' label="Referrals" icon={<PermPhoneMsgIcon />} />}
        <BottomNavigationAction component={Link} to='/volunteers' label="Volunteers" icon={<PeopleIcon />} />
        <BottomNavigationAction component={Link} to='/communities' label="Communities" icon={<Diversity3Icon />} />
      </BottomNavigation>
      <Drawer
        sx={{
          zIndex: theme.zIndex.drawer + 2,
          '& .MuiDrawer-paper': {
            padding: 2,
            width: 200
          }}}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <ShellContextSwitcher />
        {/* <div style={{ overflowX: 'hidden', position: 'fixed', bottom: 0, marginLeft: 4}}>
          <Copyright />
        </div> */}
      </Drawer>
    </Paper>
  );
}
