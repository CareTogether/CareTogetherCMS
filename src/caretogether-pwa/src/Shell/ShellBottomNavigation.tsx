import { useState } from 'react';
import {
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Divider,
  Drawer,
  List,
  Paper,
  useTheme,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PermPhoneMsgIcon from '@mui/icons-material/PermPhoneMsg';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import SupportIcon from '@mui/icons-material/Support';
import { Link, useLocation } from 'react-router-dom';
import { ShellContextSwitcher } from './ShellContextSwitcher';
import { selectedLocationContextState } from '../Model/Data';
import { useLoadable } from '../Hooks/useLoadable';
import { ListItemLink } from './ListItemLink';
import { useFeatureFlags } from '../Model/ConfigurationModel';
import { useGlobalPermissions } from '../Model/SessionModel';
import { Permission } from '../GeneratedClient';
import { Stack } from '@mui/system';
import { queueItemsCountQuery } from '../Model/QueueModel';
import { Inbox } from '@mui/icons-material';

export function ShellBottomNavigation() {
  const theme = useTheme();

  const location = useLocation();

  const context = useLoadable(selectedLocationContextState);
  const locationPrefix = `/org/${context?.organizationId}/${context?.locationId}`;

  const links = [
    new RegExp(`^$never`),
    new RegExp(`^${locationPrefix}/*$`),
    new RegExp(`^${locationPrefix}/v1cases/*.*$`),
    new RegExp(`^${locationPrefix}/volunteers/*.*$`),
    new RegExp(`^${locationPrefix}/communities/*.*$`),
  ];
  const selectedLink = Math.max(
    links.findIndex((link) => location.pathname.match(link) != null),
    0
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const flags = useFeatureFlags();
  const permissions = useGlobalPermissions();

  const queueItemsCount = useLoadable(queueItemsCountQuery);

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
      }}
    >
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
            color: theme.palette.primary.contrastText,
          },
          '& .MuiBottomNavigationAction-root.Mui-selected': {
            color: theme.palette.secondary.main,
          },
        }}
      >
        <BottomNavigationAction
          icon={<MenuIcon />}
          onClick={() => setDrawerOpen(true)}
        />
        <BottomNavigationAction
          component={Link}
          to={`${locationPrefix}/inbox`}
          label="Inbox"
          icon={
            <Badge badgeContent={queueItemsCount} color="secondary">
              <Inbox />
            </Badge>
          }
        />
        <BottomNavigationAction
          component={Link}
          to={`${locationPrefix}/v1cases`}
          label="Cases"
          icon={<PermPhoneMsgIcon />}
        />
        <BottomNavigationAction
          component={Link}
          to={`${locationPrefix}/volunteers`}
          label="Volunteers"
          icon={<PeopleIcon />}
        />
      </BottomNavigation>
      <Drawer
        sx={{
          zIndex: theme.zIndex.drawer + 2,
          '& .MuiDrawer-paper': {
            padding: 2,
            width: 200,
          },
        }}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Stack padding={1} spacing={1}>
          <ShellContextSwitcher />
          {flags && (
            <List
              aria-label="secondary navigation"
              sx={{
                position: 'relative',
                top: 100,
                zIndex: theme.zIndex.drawer + 3,
              }}
            >
              <>
                <Divider />
                <ListItemLink
                  darkColor
                  to={`${locationPrefix}`}
                  primary="Dashboard"
                  icon={<DashboardIcon />}
                />
                {permissions(Permission.AccessCommunitiesScreen) && (
                  <ListItemLink
                    darkColor
                    to={`${locationPrefix}/communities`}
                    primary="Communities"
                    icon={<Diversity3Icon />}
                  />
                )}
                {permissions(Permission.AccessSettingsScreen) && (
                  <ListItemLink
                    darkColor
                    to={`${locationPrefix}/settings`}
                    primary="Settings"
                    icon={<SettingsIcon />}
                  />
                )}
                <ListItemLink
                  darkColor
                  to={`${locationPrefix}/support`}
                  primary="Support"
                  icon={<SupportIcon />}
                />
              </>
            </List>
          )}
          {/* <div style={{ overflowX: 'hidden', position: 'fixed', bottom: 0, marginLeft: 4}}>
            <Copyright />
          </div> */}
        </Stack>
      </Drawer>
    </Paper>
  );
}
