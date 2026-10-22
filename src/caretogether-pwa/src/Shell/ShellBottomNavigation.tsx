import { useState } from 'react';
import {
  Dashboard as DashboardIcon,
  Diversity3 as Diversity3Icon,
  Inbox,
  Insights as InsightsIcon,
  Menu as MenuIcon,
  People as PeopleIcon,
  PermPhoneMsg as PermPhoneMsgIcon,
  Settings as SettingsIcon,
  Support as SupportIcon,
} from '@mui/icons-material';
import {
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  useTheme,
} from '@mui/material';
import { Link, useLocation, useMatch } from 'react-router-dom';
import { ShellContextSwitcher } from './ShellContextSwitcher';
import { useSelectedLocationContext } from '../Model/Data';
import { ListItemLink } from './ListItemLink';
import { useFeatureFlagsLoadable } from '../Model/ConfigurationModel';
import { useGlobalPermissionsLoadable } from '../Model/SessionModel';
import { Permission } from '../GeneratedClient';
import { Stack } from '@mui/system';
import { useQueueItemsCountLoadable } from '../Model/QueueModel';
import { useAtomValue } from 'jotai';
import { reportSubmenuItemsAtom } from '../Model/UI';
import { useCanAccessReferrals } from './useCanAccessReferrals';

export function ShellBottomNavigation() {
  const theme = useTheme();

  const location = useLocation();

  const context = useSelectedLocationContext();
  const locationPrefix = `/org/${context?.organizationId}/${context?.locationId}`;

  const links = [
    new RegExp(`^$never`),
    new RegExp(`^${locationPrefix}/inbox/*.*$`),
    new RegExp(`^${locationPrefix}/clients/*.*$`),
    new RegExp(`^${locationPrefix}/volunteers/*.*$`),
  ];
  const selectedLink = Math.max(
    links.findIndex((link) => location.pathname.match(link) != null),
    0
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const flags = useFeatureFlagsLoadable();
  const permissions = useGlobalPermissionsLoadable();
  const canAccessReferrals = useCanAccessReferrals();
  const reportSubmenuItems = useAtomValue(reportSubmenuItemsAtom);
  const isReportsPage = useMatch(`${locationPrefix}/reports/*`) !== null;

  const queueItemsCount = useQueueItemsCountLoadable();

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
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
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
          to={`${locationPrefix}/clients`}
          label="Clients"
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
        }}
        slotProps={{
          paper: {
            sx: {
              padding: 2,
              width: 200,
            },
          },
        }}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Stack spacing={1} sx={{ p: 1 }}>
          <ShellContextSwitcher />
          {flags && (
            <List
              aria-label="secondary navigation"
              onClick={(event) => {
                if ((event.target as Element).closest('a')) {
                  setDrawerOpen(false);
                }
              }}
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
                {canAccessReferrals && (
                  <ListItemLink
                    className="ph-unmask"
                    darkColor
                    to={`${locationPrefix}/referrals`}
                    primary="Referrals"
                    icon={<PermPhoneMsgIcon />}
                  />
                )}
                {permissions(Permission.AccessOrganizationsScreen) && (
                  <ListItemLink
                    darkColor
                    to={`${locationPrefix}/organizations`}
                    primary="Organizations"
                    icon={<Diversity3Icon />}
                  />
                )}
                {permissions(Permission.AccessReportsScreen) && (
                  <>
                    <ListItemLink
                      className="ph-unmask"
                      darkColor
                      to={`${locationPrefix}/reports`}
                      primary="Reports"
                      icon={<InsightsIcon />}
                    />
                    {isReportsPage && reportSubmenuItems.length > 0 && (
                      <li>
                        <List aria-label="Report pages" disablePadding>
                          {reportSubmenuItems.map((item) => (
                            <li key={item.label}>
                              <ListItemButton
                                component="button"
                                type="button"
                                selected={item.isActive}
                                aria-current={
                                  item.isActive ? 'page' : undefined
                                }
                                onClick={() => {
                                  item.onClick();
                                  setDrawerOpen(false);
                                }}
                                sx={{ width: '100%', pl: 3 }}
                              >
                                <ListItemText
                                  primary={item.label}
                                  slotProps={{
                                    primary: {
                                      sx: { overflowWrap: 'anywhere' },
                                    },
                                  }}
                                />
                              </ListItemButton>
                            </li>
                          ))}
                        </List>
                      </li>
                    )}
                  </>
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
