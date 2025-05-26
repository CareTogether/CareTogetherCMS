import {
  Badge,
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
import { ListItemLink } from './ListItemLink';
import { useFeatureFlags } from '../Model/ConfigurationModel';
import { Copyright } from './Copyright';
import { useGlobalPermissions } from '../Model/SessionModel';
import { Permission } from '../GeneratedClient';
import { selectedLocationContextState } from '../Model/Data';
import { useLoadable } from '../Hooks/useLoadable';
import { Inbox } from '@mui/icons-material';
import { queueItemsCountQuery } from '../Model/QueueModel';
import Feedback from './Feedback';
import { useFeatureFlagEnabled as usePostHogFeatureFlagEnabled } from 'posthog-js/react';

interface SideNavigationMenuProps {
  open: boolean;
}
function SideNavigationMenu({ open }: SideNavigationMenuProps) {
  const flags = useFeatureFlags();
  const permissions = useGlobalPermissions();

  const showReports = usePostHogFeatureFlagEnabled('reports');

  const context = useLoadable(selectedLocationContextState);
  const locationPrefix = `/org/${context?.organizationId}/${context?.locationId}`;

  const queueItemsCount = useLoadable(queueItemsCountQuery);

  return (
    //  <List aria-label="main navigation">
    //    <ListItemLink to="/dashboard" primary="Dashboard" icon={<DashboardIcon sx={{color: '#fff'}} />} />
    //  </List>
    <List
      aria-label="secondary navigation"
      sx={{
        '& .MuiListItem-root.Mui-selected': { color: '#ffff' },
        '& .MuiListItem-root.Mui-selected svg': { color: '#ffff' },
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
            icon={<DashboardIcon sx={{ color: '#fff8' }} />}
          />
          <ListItemLink
            className="ph-unmask"
            to={`${locationPrefix}/inbox`}
            primary="Inbox"
            icon={
              <Badge badgeContent={queueItemsCount} color="secondary">
                <Inbox sx={{ color: '#fff8' }} />
              </Badge>
            }
          />
          {permissions(Permission.AccessPartneringFamiliesScreen) && (
            <ListItemLink
              className="ph-unmask"
              to={`${locationPrefix}/referrals`}
              primary="Referrals"
              icon={<PermPhoneMsgIcon sx={{ color: '#fff8' }} />}
            />
          )}
          {permissions(Permission.AccessVolunteersScreen) && (
            <ListItemLink
              className="ph-unmask"
              to={`${locationPrefix}/volunteers`}
              primary="Volunteers"
              icon={<PeopleIcon sx={{ color: '#fff8' }} />}
            />
          )}
          {permissions(Permission.AccessCommunitiesScreen) && (
            <ListItemLink
              className="ph-unmask"
              to={`${locationPrefix}/communities`}
              primary="Communities"
              icon={<Diversity3Icon sx={{ color: '#fff8' }} />}
            />
          )}
          {permissions(Permission.AccessReportsScreen) && showReports && (
            <ListItemLink
              className="ph-unmask"
              to={`${locationPrefix}/reports`}
              primary="Reports"
              icon={<InsightsIcon sx={{ color: '#fff8' }} />}
            />
          )}
          {permissions(Permission.AccessSettingsScreen) && (
            <>
              <Divider />
              <ListItemLink
                className="ph-unmask"
                to={`${locationPrefix}/settings`}
                primary="Settings"
                icon={<SettingsIcon sx={{ color: '#fff8' }} />}
              />

              <ListItemLink
                className="ph-unmask"
                to={`${locationPrefix}/support`}
                primary="Support"
                icon={<SupportIcon sx={{ color: '#fff8' }} />}
              />
            </>
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

  // const drawerPaperOpenStyle = {
  //   position: 'relative',
  //   whiteSpace: 'nowrap',
  //   width: 200,
  //   transition: theme.transitions.create('width', {
  //     easing: theme.transitions.easing.sharp,
  //     duration: theme.transitions.duration.enteringScreen
  //   })
  // };

  // const drawerPaperCloseStyle = {
  //   position: 'relative',
  //   whiteSpace: 'nowrap',
  //   overflowX: 'hidden',
  //   width: theme.spacing(7),
  //   [theme.breakpoints.up('sm')]: {
  //     width: theme.spacing(9),
  //   },
  //   transition: theme.transitions.create('width', {
  //     easing: theme.transitions.easing.sharp,
  //     duration: theme.transitions.duration.leavingScreen,
  //   })
  // };

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
          backgroundColor: theme.palette.primary.dark,
          color: theme.palette.primary.contrastText,
          overflowX: 'hidden',
        },
      }}
    >
      <Stack sx={{ width: width, paddingTop: { xs: 7, sm: 8, md: 6 } }}>
        <SideNavigationMenu open={open} />
        {open && (
          <div
            style={{
              overflowX: 'hidden',
              width: width - 4,
              position: 'fixed',
              bottom: 0,
              marginLeft: 4,
            }}
          >
            <Stack spacing={5} alignItems="center">
              <Feedback />
              <Copyright />
            </Stack>
          </div>
        )}
      </Stack>
    </Drawer>
  );
}
