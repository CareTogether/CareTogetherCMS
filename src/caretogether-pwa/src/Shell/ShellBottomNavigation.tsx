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
import { Link, useMatch } from 'react-router-dom';
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

  const context = useSelectedLocationContext();
  const locationPrefix = `/org/${context?.organizationId}/${context?.locationId}`;

  const [drawerOpen, setDrawerOpen] = useState(false);

  const flags = useFeatureFlagsLoadable();
  const permissions = useGlobalPermissionsLoadable();
  const canAccessClients = permissions(
    Permission.AccessPartneringFamiliesScreen
  );
  const canAccessVolunteers = permissions(Permission.AccessVolunteersScreen);
  const inboxMatch = useMatch(`${locationPrefix}/inbox/*`);
  const clientsMatch = useMatch(`${locationPrefix}/clients/*`);
  const volunteersMatch = useMatch(`${locationPrefix}/volunteers/*`);
  const selectedLink = inboxMatch
    ? 'inbox'
    : canAccessClients && clientsMatch
      ? 'clients'
      : canAccessVolunteers && volunteersMatch
        ? 'volunteers'
        : 'menu';
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
        zIndex: theme.zIndex.appBar,
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
          value="menu"
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
          icon={<MenuIcon />}
          onClick={() => setDrawerOpen(true)}
        />
        <BottomNavigationAction
          value="inbox"
          component={Link}
          to={`${locationPrefix}/inbox`}
          label="Inbox"
          icon={
            <Badge badgeContent={queueItemsCount} color="secondary">
              <Inbox />
            </Badge>
          }
        />
        {canAccessClients && (
          <BottomNavigationAction
            value="clients"
            component={Link}
            to={`${locationPrefix}/clients`}
            label="Clients"
            icon={<PermPhoneMsgIcon />}
          />
        )}
        {canAccessVolunteers && (
          <BottomNavigationAction
            value="volunteers"
            component={Link}
            to={`${locationPrefix}/volunteers`}
            label="Volunteers"
            icon={<PeopleIcon />}
          />
        )}
      </BottomNavigation>
      <Drawer
        sx={{
          zIndex: theme.zIndex.drawer + 2,
        }}
        slotProps={{
          paper: {
            sx: {
              width: 280,
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflowY: 'auto',
            },
          },
        }}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Stack
          spacing={2}
          sx={{
            p: 2,
            '& > .MuiStack-root > .MuiTypography-root': { px: 0, top: 0 },
            '& > .MuiStack-root > .MuiInputBase-root': {
              width: '100%',
              ml: 0,
              minHeight: 44,
            },
            '& .MuiSelect-select.MuiInputBase-input': { pr: 4 },
          }}
        >
          <ShellContextSwitcher contained />
          {flags && (
            <List
              aria-label="secondary navigation"
              onClick={(event) => {
                if ((event.target as Element).closest('a')) {
                  setDrawerOpen(false);
                }
              }}
              sx={{
                py: 0,
                '& .MuiListItemButton-root': {
                  minHeight: 48,
                  minWidth: 0,
                  px: 0,
                  borderRadius: 1,
                },
                '& .MuiListItemIcon-root': { minWidth: 32, mr: 1 },
                '& .MuiList-root .MuiListItemButton-root': { pl: 5 },
                '& .MuiListItemButton-root.Mui-selected': {
                  bgcolor: 'action.selected',
                  color: 'primary.main',
                  '& .MuiListItemIcon-root, & .MuiListItemText-root': {
                    color: 'primary.main',
                  },
                },
                '& .MuiListItemButton-root.Mui-focusVisible': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: -2,
                },
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
                {permissions(Permission.AccessSupportScreen) && (
                  <ListItemLink
                    darkColor
                    to={`${locationPrefix}/support`}
                    primary="Support"
                    icon={<SupportIcon />}
                  />
                )}
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
