import makeStyles from '@mui/styles/makeStyles';
import { IconButton, Drawer, Divider, List, useMediaQuery, useTheme } from '@mui/material';
import PermPhoneMsgIcon from '@mui/icons-material/PermPhoneMsg';
import PeopleIcon from '@mui/icons-material/People';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { ListItemLink } from './ListItemLink';
import { useFeatureFlags } from '../Model/ConfigurationModel';
import { CurrentFeatureFlags } from '../GeneratedClient';
import { LocationSwitcher } from './LocationSwitcher';
import { Copyright } from './Copyright';

const drawerWidth = 200;
const useStyles = makeStyles((theme) => ({
  drawerPaperOpen: {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    })
  },
  drawerPaperClose: {
    position: 'relative',
    whiteSpace: 'nowrap',
    overflowX: 'hidden',
    width: theme.spacing(7),
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing(9),
    },
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    })
  },
  drawerAlignment: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 8px',
  },
  stickToBottom: {
    position: 'fixed',
    bottom: 0,
    marginLeft: 10,
  },
}));

//const mainListItems = (flags: CurrentFeatureFlags) => (
//  <List aria-label="main navigation">
//    <ListItemLink to="/dashboard" primary="Dashboard" icon={<DashboardIcon />} />
//  </List>
//);

const secondaryListItems = (flags: CurrentFeatureFlags) => (
  <List aria-label="secondary navigation">
    {flags.viewReferrals && <ListItemLink to="/referrals" primary="Referrals" icon={<PermPhoneMsgIcon />} />}
    <ListItemLink to="/volunteers" primary="Volunteers" icon={<PeopleIcon />} />
  </List>
);

interface DrawerProps {
  open: boolean,
  handleDrawerClose: () => void;
}

export function MainDrawer(props: DrawerProps) {
    const classes = useStyles();
  
    const featureFlags = useFeatureFlags();

    const { open, handleDrawerClose } = props;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <Drawer
        variant="permanent"
        classes={{ paper: open ? classes.drawerPaperOpen : classes.drawerPaperClose }}
        open={open}
        >
        <div className={classes.drawerAlignment}>
          {isMobile ? null : <LocationSwitcher />}
          <IconButton onClick={handleDrawerClose} size="large">
            <ChevronLeftIcon />
          </IconButton>
        </div>
        {/* no mainListItems yet, so commenting out
        <Divider /> 
        {mainListItems(featureFlags)} */}
        <Divider /> 
        {secondaryListItems(featureFlags)}
        <Divider />
        {open && 
          <div className={classes.stickToBottom}>
            <Copyright />
          </div>}
      </Drawer>
    )
}

