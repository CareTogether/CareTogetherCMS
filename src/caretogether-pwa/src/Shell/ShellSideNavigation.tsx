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
import PermPhoneMsgIcon from '@mui/icons-material/PermPhoneMsg';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import InsightsIcon from '@mui/icons-material/Insights';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SupportIcon from '@mui/icons-material/Support';
import { useFeatureFlags } from '../Model/ConfigurationModel';
import { Copyright } from './Copyright';
import { Version } from './Version';
import { useGlobalPermissions } from '../Model/SessionModel';
import { Permission } from '../GeneratedClient';
import { selectedLocationContextState } from '../Model/Data';
import { useLoadable } from '../Hooks/useLoadable';
import { Inbox } from '@mui/icons-material';
import { queueItemsCountQuery } from '../Model/QueueModel';
import Feedback from './Feedback';
import { useRecoilValue } from 'recoil';
import { reportSubmenuItemsAtom } from '../Model/UI';
import { ListItemLink } from './ListItemLink';
import { useAppNavigate } from '../Hooks/useAppNavigate';

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

  return (
    <List
      aria-label="secondary navigation"
      sx={{
        '& .MuiListItem-root.Mui-selected': { color: '#ffff' },
        '& .MuiListItem-root.Mui-selected svg': { color: '#ffff' },
        // Prevent horizontal overflow and text wrapping
        '& .MuiListItem-root': {
          paddingLeft: 2,
          paddingRight: 1,
        },
        '& .MuiListItemText-primary': {
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
      }}
    >
      {flags === null ? (
        <>
          <Stack padding={1} spacing={1}>
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
          />
          {permissions(Permission.AccessPartneringFamiliesScreen) && (
            <ListItemLink
              className="ph-unmask"
              to={`${locationPrefix}/cases`}
              primary="Cases"
              icon={<PermPhoneMsgIcon />}
            />
          )}
          {permissions(Permission.AccessVolunteersScreen) && (
            <ListItemLink
              className="ph-unmask"
              to={`${locationPrefix}/volunteers`}
              primary="Volunteers"
              icon={<PeopleIcon />}
            />
          )}
          {permissions(Permission.AccessCommunitiesScreen) && (
            <ListItemLink
              className="ph-unmask"
              to={`${locationPrefix}/communities`}
              primary="Communities"
              icon={<Diversity3Icon />}
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
            />
          )}
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
        '& .MuiDrawer-paper': {
          width: width, // Force fixed width
          minWidth: width, // Prevent shrinking
          maxWidth: width, // Prevent expanding
          backgroundColor: theme.palette.primary.dark,
          color: theme.palette.primary.contrastText,
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box sx={{ paddingTop: { xs: 7, sm: 8, md: 6 } }}>
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
          <Stack className="ph-unmask" alignItems="center" sx={{ py: 2 }}>
            <Box mb={2}>
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
