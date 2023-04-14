import { useState } from 'react';
import { BottomNavigation, BottomNavigationAction, Drawer, Paper, useTheme } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PermPhoneMsgIcon from '@mui/icons-material/PermPhoneMsg';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, useLocation } from 'react-router-dom';
import { ShellContextSwitcher } from './ShellContextSwitcher';
import { useRecoilValue } from 'recoil';
import { selectedLocationContextState } from '../Model/Data';

export function ShellBottomNavigation() {
  const theme = useTheme();
  
  const location = useLocation();

  const context = useRecoilValue(selectedLocationContextState);
  const locationPrefix = `/${context.organizationId}/${context.locationId}`;

  const links = [
    new RegExp(`${locationPrefix}/*.*`),
    new RegExp(`${locationPrefix}/referrals/*.*`),
    new RegExp(`${locationPrefix}/volunteers/*.*`),
    new RegExp(`${locationPrefix}/communities/*.*`)
  ];
  const selectedLink = links.findIndex(link => location.pathname.match(link) != null);
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
        {<BottomNavigationAction component={Link} to={`${locationPrefix}`} label="Dashboard" icon={<DashboardIcon />} />}
        {<BottomNavigationAction component={Link} to={`${locationPrefix}/referrals`} label="Referrals" icon={<PermPhoneMsgIcon />} />}
        <BottomNavigationAction component={Link} to={`${locationPrefix}/volunteers`} label="Volunteers" icon={<PeopleIcon />} />
        <BottomNavigationAction component={Link} to={`${locationPrefix}/communities`} label="Communities" icon={<Diversity3Icon />} />
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
