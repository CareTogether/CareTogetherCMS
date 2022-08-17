import { Drawer, List, Skeleton, Stack, useTheme } from '@mui/material';
import PermPhoneMsgIcon from '@mui/icons-material/PermPhoneMsg';
import PeopleIcon from '@mui/icons-material/People';
import { ListItemLink } from '../ListItemLink';
import { useFeatureFlags } from '../Model/ConfigurationModel';
import { Copyright } from '../Copyright';

interface SideNavigationMenuProps {
  open: boolean;
}
function SideNavigationMenu({ open }: SideNavigationMenuProps) {
  const flags = useFeatureFlags();

  return (
    //  <List aria-label="main navigation">
    //    <ListItemLink to="/dashboard" primary="Dashboard" icon={<DashboardIcon />} />
    //  </List>
    <List aria-label="secondary navigation">
      {flags === null
        ? <>
            <Stack padding={1} spacing={1}>
              <Stack direction='row'>
                <Skeleton variant="circular" width={30} height={30} />
                {open &&
                  <Skeleton variant="rounded" width={100} height={24} sx={{marginLeft: 2, marginTop: 0.5}} />}
              </Stack>
              <Stack direction='row'>
                <Skeleton variant="circular" width={30} height={30} />
                {open &&
                  <Skeleton variant="rounded" width={100} height={24} sx={{marginLeft: 2, marginTop: 0.5}} />}
              </Stack>
            </Stack>
          </>
        : <>
            {flags?.viewReferrals && <ListItemLink to="/referrals" primary="Referrals" icon={<PermPhoneMsgIcon />} />}
            <ListItemLink to="/volunteers" primary="Volunteers" icon={<PeopleIcon />} />
          </>}
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
    <Drawer variant='permanent' open={open}
      sx={{
        width: width,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        '& .MuiDrawer-paper': {
          backgroundColor: theme.palette.primary.dark,
          color: theme.palette.primary.contrastText
        }
      }}>
      <Stack sx={{ width: width, paddingTop: { xs: 7, sm: 8, md: 6 } }}>
        <SideNavigationMenu open={open} />
        <div style={{ position: 'fixed', bottom: 0, marginLeft: 10}}>
          <Copyright />
        </div>
      </Stack>
    </Drawer>
  );
}
