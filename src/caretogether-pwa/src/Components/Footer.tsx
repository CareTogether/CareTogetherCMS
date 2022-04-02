import makeStyles from '@mui/styles/makeStyles';
import { BottomNavigation, BottomNavigationAction, Divider, Drawer, IconButton, useTheme } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import PermPhoneMsgIcon from '@mui/icons-material/PermPhoneMsg';
import PeopleIcon from '@mui/icons-material/People';
import { useFeatureFlags } from '../Model/ConfigurationModel';
import { useState } from 'react';
import { LocationSwitcher } from './LocationSwitcher';
import { Copyright } from './Copyright';
//import DashboardIcon from '@mui/icons-material/Dashboard';

const useStyles = makeStyles((theme) => ({
  stickToBottom: {
    width: '100%',
    position: 'fixed',
    bottom: 0,
    backgroundColor: theme.palette.grey[300]
  },
}));

export function Footer(props: any) {
  const location = useLocation();
  const classes = useStyles();
  
  const featureFlags = useFeatureFlags();

  const links = [/*'/dashboard',*/ '/referrals', '/volunteers'];
  const selectedLink = links.findIndex(link => location.pathname.startsWith(link));

  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();

  return (
    <>
      <BottomNavigation
        value={selectedLink}
        showLabels
        className={classes.stickToBottom}
      >
        <BottomNavigationAction icon={<MenuIcon />} onClick={() => setDrawerOpen(true)} />
        {/* <BottomNavigationAction component={Link} to='/dashboard' label="Dashboard" icon={<DashboardIcon />} /> */}
        {featureFlags.viewReferrals && <BottomNavigationAction component={Link} to='/referrals' label="Referrals" icon={<PermPhoneMsgIcon />} />}
        <BottomNavigationAction component={Link} to='/volunteers' label="Volunteers" icon={<PeopleIcon />} />
      </BottomNavigation>
      <Drawer
        sx={{ zIndex: theme.zIndex.drawer + 2, '& .MuiDrawer-paper': { padding: 2 }}}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <LocationSwitcher />
        <Copyright />
      </Drawer>
    </>
  );
}
