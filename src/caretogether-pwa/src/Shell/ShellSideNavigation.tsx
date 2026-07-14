import {
  Dashboard as DashboardIcon,
  Diversity3 as Diversity3Icon,
  Inbox,
  Insights as InsightsIcon,
  People as PeopleIcon,
  PermPhoneMsg as PermPhoneMsgIcon,
  Settings as SettingsIcon,
  Support as SupportIcon,
  Handshake as HandshakeIcon,
} from '@mui/icons-material';
import {
  Badge,
  Box,
  Divider,
  Drawer,
  List,
  Skeleton,
  Stack,
  useTheme,
} from '@mui/material';
import { useFeatureFlags } from '../Model/ConfigurationModel';
import { Copyright } from './Copyright';
import { Version } from './Version';
import { useGlobalPermissions } from '../Model/SessionModel';
import { Permission } from '../GeneratedClient';
import { selectedLocationContextState } from '../Model/Data';
import { useLoadable } from '../Hooks/useLoadable';
import { queueItemsCountQuery } from '../Model/QueueModel';
import Feedback from './Feedback';
import { useRecoilValue } from 'recoil';
import { reportSubmenuItemsAtom } from '../Model/UI';
import { ListItemLink } from './ListItemLink';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import WhatsNew from './WhatsNew';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { SHELL_DRAWER_TOP_OFFSET } from './shellLayoutConstants';

interface SideNavigationMenuProps {
  open: boolean;
}
function SideNavigationMenu({ open }: SideNavigationMenuProps) {
  const flags = useFeatureFlags();
  const permissions = useGlobalPermissions();

  const appNavigate = useAppNavigate();

  const context = useLoadable(selectedLocationContextState);
  const locationPrefix = `/org/${context?.organizationId}/${context?.locationId}`;

  const queueItemsCount = useLoadable(queueItemsCountQuery);

  const reportSubmenuItems = useRecoilValue(reportSubmenuItemsAtom);

  const referralsEnabled = useFeatureFlagEnabled('referrals');
  const collapsed = !open;

  return (
    <List
      aria-label="secondary navigation"
      sx={{
        '& .MuiListItem-root.Mui-selected': { color: '#ffff' },
        '& .MuiListItem-root.Mui-selected svg': { color: '#ffff' },
      }}
    >
      {flags === null ? (
        <>
          <Stack spacing={1} sx={{ p: 1 }}>
            <Stack direction="row">
              <Skeleton variant="circular" width={30} height={30} />
              {open && (
                <Skeleton
                  variant="rounded"
                  width={100}
                  height={24}
                  sx={{ marginLeft: 2, marginTop: 0.5 }}
                />
              )}
            </Stack>
            <Stack direction="row">
              <Skeleton variant="circular" width={30} height={30} />
              {open && (
                <Skeleton
                  variant="rounded"
                  width={100}
                  height={24}
                  sx={{ marginLeft: 2, marginTop: 0.5 }}
                />
              )}
            </Stack>
          </Stack>
        </>
      ) : (
        <>
          <ListItemLink
            className="ph-unmask"
            to={`${locationPrefix}`}
            primary="Dashboard"
            icon={<DashboardIcon />}
            collapsed={collapsed}
          />
          <ListItemLink
            className="ph-unmask"
            to={`${locationPrefix}/inbox`}
            primary="Inbox"
            icon={
              <Badge badgeContent={queueItemsCount} color="secondary">
                <Inbox />
              </Badge>
            }
            collapsed={collapsed}
          />
          {permissions(Permission.ViewV1Referral) && referralsEnabled && (
            <ListItemLink
              className="ph-unmask"
              to={`${locationPrefix}/referrals`}
              primary="Referrals"
              icon={<PermPhoneMsgIcon />}
              collapsed={collapsed}
            />
          )}

          {permissions(Permission.AccessPartneringFamiliesScreen) && (
            <ListItemLink
              className="ph-unmask"
              to={`${locationPrefix}/clients`}
              primary="Clients"
              icon={<HandshakeIcon />}
              collapsed={collapsed}
            />
          )}
          {permissions(Permission.AccessVolunteersScreen) && (
            <ListItemLink
              className="ph-unmask"
              to={`${locationPrefix}/volunteers`}
              primary="Volunteers"
              icon={<PeopleIcon />}
              collapsed={collapsed}
            />
          )}
          {permissions(Permission.AccessCommunitiesScreen) && (
            <ListItemLink
              className="ph-unmask"
              to={`${locationPrefix}/communities`}
              primary="Communities"
              icon={<Diversity3Icon />}
              collapsed={collapsed}
            />
          )}

          {permissions(Permission.AccessReportsScreen) && (
            <ListItemLink
              className="ph-unmask"
              to={`${locationPrefix}/reports`}
              primary="Reports"
              icon={<InsightsIcon />}
              subitems={reportSubmenuItems}
              defaultOpen
              collapsed={collapsed}
            />
          )}

          {(permissions(Permission.AccessSettingsScreen) ||
            permissions(Permission.AccessSupportScreen)) && <Divider />}

          {permissions(Permission.AccessSettingsScreen) && (
            <ListItemLink
              className="ph-unmask"
              to={`${locationPrefix}/settings`}
              primary="Settings"
              icon={<SettingsIcon sx={{ color: '#fff8' }} />}
              collapsed={collapsed}
              {...(open && {
                subitems: [
                  {
                    label: 'Roles',
                    isActive: location.pathname.includes('/settings/roles'),
                    onClick: () => appNavigate.settingsRoles(),
                  },
                  {
                    label: 'Locations',
                    isActive: location.pathname.includes('/settings/locations'),
                    onClick: () => appNavigate.settingsLocations(),
                  },
                ],
              })}
            />
          )}

          {permissions(Permission.AccessSupportScreen) && (
            <ListItemLink
              className="ph-unmask"
              to={`${locationPrefix}/support`}
              primary="Support"
              icon={<SupportIcon />}
              collapsed={collapsed}
            />
          )}
          <WhatsNew collapsed={collapsed} />
        </>
      )}
    </List>
  );
}

interface ShellSideNavigationProps {
  open: boolean;
  width: number;
}
export function ShellSideNavigation({ open, width }: ShellSideNavigationProps) {
  const theme = useTheme();

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: width,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        overflowX: 'hidden',
      }}
      slotProps={{
        paper: {
          sx: {
            width: width, // Force fixed width
            minWidth: width, // Prevent shrinking
            maxWidth: width, // Prevent expanding
            boxSizing: 'border-box',
            backgroundColor: theme.palette.primary.dark,
            color: theme.palette.primary.contrastText,
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      <Box sx={{ height: SHELL_DRAWER_TOP_OFFSET, flexShrink: 0 }}>
        {/* Spacer for top app bar */}
      </Box>
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <SideNavigationMenu open={open} />
      </Box>
      {open && (
        <Box
          sx={{
            backgroundColor: theme.palette.primary.dark,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Stack
            className="ph-unmask"
            sx={{ alignItems: 'center', py: 2 }}
          >
            <Box sx={{ mb: 2 }}>
              <Feedback />
            </Box>
            <Version />
            <Copyright />
          </Stack>
        </Box>
      )}
    </Drawer>
  );
}
