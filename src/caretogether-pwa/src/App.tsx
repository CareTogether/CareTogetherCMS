import React from 'react';
import clsx from 'clsx';
import { fade, makeStyles } from '@material-ui/core/styles';
import { Typography, InputBase, CssBaseline, AppBar, Toolbar, IconButton, Badge, Drawer, Divider, List, BottomNavigation, BottomNavigationAction, useMediaQuery, useTheme } from '@material-ui/core';
import PermPhoneMsgIcon from '@material-ui/icons/PermPhoneMsg';
import EmojiPeopleIcon from '@material-ui/icons/EmojiPeople';
import PeopleIcon from '@material-ui/icons/People';
import SearchIcon from '@material-ui/icons/Search';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import MenuIcon from '@material-ui/icons/Menu';
import NotificationsIcon from '@material-ui/icons/Notifications';
import AssignmentIcon from '@material-ui/icons/Assignment';
import AssignmentTurnedInIcon from '@material-ui/icons/AssignmentTurnedIn';
import { Route, Switch, Redirect, BrowserRouter as Router, Link } from "react-router-dom";
import { ListItemLink } from './Components/ListItemLink';
import { Arrangements } from './Components/Arrangements';
import { Referrals } from './Components/Referrals';
import { VolunteerApproval } from './Components/VolunteerApproval';
import { VolunteerApplications } from './Components/VolunteerApplications';
import { VolunteerProgress } from './Components/VolunteerProgress';
import { Contacts } from './Components/Contacts';
import { Communities } from './Components/Communities';
import { useRecoilValue } from 'recoil';
import { locationNameData, organizationNameData } from './Model/ConfigurationModel';
import { Volunteers } from './Components/Volunteers';

const copyrightStyles = makeStyles((theme) => ({
  copyright: {
    lineHeight: '3em'
  }
}));

function Copyright() {
  const classes = copyrightStyles();
  return (
    <Typography variant="body2" color="textSecondary" align="center" className={classes.copyright}>
      {' © '} {new Date().getFullYear()} &nbsp;
      <a color="inherit" href="https://caretogether.io/" target="_blank" rel="noreferrer">
        CareTogether CMS
      </a><br />
    </Typography>
  );
}

const drawerWidth = 200;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  toolbar: {
    paddingRight: 24, // keep right padding when drawer closed
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 8px',
  },
  drawerHeaderOrganization: {
    margin: '0',
    paddingLeft: '8px',
    fontSize: '16px'
  },
  drawerHeaderLocation: {
    margin: '0',
    paddingLeft: '8px',
    fontSize: '14px'
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    marginLeft: 0,
    marginRight: theme.spacing(1),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing(1),
      width: 'auto',
    },
  },
  searchIcon: {
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRoot: {
    color: 'inherit',
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: '12ch',
      '&:focus': {
        width: '20ch',
      },
    },
  },
  menuButton: {
    marginRight: 36,
  },
  menuButtonHidden: {
    display: 'none',
  },
  title: {
    flexGrow: 1,
  },
  drawerPaper: {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerPaperClose: {
    overflowX: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing(7),
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing(9),
    },
  },
  appBarSpacer: {
    height: 48,
  },
  content: {
    flexGrow: 1,
    height: '100vh',
    overflow: 'auto',
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  stickToBottom: {
    width: '100%',
    position: 'fixed',
    bottom: 0,
  },
}));

const mainListItems = (
  <List aria-label="main navigation">
    <ListItemLink to="/referrals" primary="Referrals" icon={<PermPhoneMsgIcon />} />
  </List>
);

const secondaryListItems = (
  <List aria-label="secondary navigation">
    <ListItemLink to="/volunteers" primary="Volunteers" icon={<PeopleIcon />} />
    <ListItemLink to="/volunteerApproval" primary="Approvals" icon={<EmojiPeopleIcon />} />
    <ListItemLink to="/volunteerApplications" primary="Applications" icon={<AssignmentIcon />} />
    <ListItemLink to="/volunteerProgress" primary="Progress" icon={<AssignmentTurnedInIcon />} />
  </List>
);

function App() {
  const classes = useStyles();
  const [open, setOpen] = React.useState(true);
  const handleDrawerOpen = () => {
    setOpen(true);
  };
  const handleDrawerClose = () => {
    setOpen(false);
  };
  const [selectedBottomNavAction, setSelectedBottomNavAction] = React.useState(0);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const organizationName = useRecoilValue(organizationNameData);
  const locationName = useRecoilValue(locationNameData);

  return (
    <div className={classes.root}>
      <CssBaseline />
      <Router>
        <AppBar position="absolute" className={clsx(classes.appBar, (open && !isMobile) && classes.appBarShift)}>
          <Toolbar className={classes.toolbar} variant="dense">
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerOpen}
              className={clsx(classes.menuButton, open && classes.menuButtonHidden)}
            >
              <MenuIcon />
            </IconButton>
            <Typography component="h1" variant="h6" color="inherit" noWrap className={classes.title}>
              Dashboard
            </Typography>
            <div className={classes.search}>
              <div className={classes.searchIcon}>
                <SearchIcon />
              </div>
              <InputBase
                placeholder="Search…"
                classes={{
                  root: classes.inputRoot,
                  input: classes.inputInput,
                }}
                inputProps={{ 'aria-label': 'search' }}
              />
            </div>
            <IconButton color="inherit">
              <Badge badgeContent={4} color="secondary">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>
        {isMobile ? null :
          <Drawer
            variant="permanent"
            classes={{
              paper: clsx(classes.drawerPaper, !open && classes.drawerPaperClose),
            }}
            open={open}
          >
            <div className={classes.drawerHeader}>
              {isMobile ? null : <header>
                <p className={classes.drawerHeaderOrganization}>{organizationName}</p>
                <p className={classes.drawerHeaderLocation}>{locationName}</p>
              </header>}
              <IconButton onClick={handleDrawerClose}>
                <ChevronLeftIcon />
              </IconButton>
            </div>
            <Divider />
            {mainListItems}
            <Divider />
            {secondaryListItems}
            <Divider />
            {open && <Copyright />}
          </Drawer>}
        <main className={classes.content}>
          <div className={classes.appBarSpacer} />
          {/* <Container maxWidth="lg" className={classes.container}> */}
          <React.Suspense fallback={<div>Loading...</div>}>
            <Switch>
              <Route path="/arrangements">
                <Arrangements />
              </Route>
              <Route path="/referrals">
                <Referrals />
              </Route>
              <Route path="/volunteers">
                <Volunteers />
              </Route>
              <Route path="/volunteerApproval">
                <VolunteerApproval />
              </Route>
              <Route path="/volunteerApplications">
                <VolunteerApplications />
              </Route>
              <Route path="/volunteerProgress">
                <VolunteerProgress />
              </Route>
              <Route path="/contacts">
                <Contacts />
              </Route>
              <Route path="/communities">
                <Communities />
              </Route>
              <Route>
                <Redirect to="/volunteerApproval" />
              </Route>
            </Switch>
          </React.Suspense>
          {/* </Container> */}
          {isMobile ? <BottomNavigation
            value={selectedBottomNavAction}
            onChange={(_, newValue) => {
              setSelectedBottomNavAction(newValue);
            }}
            showLabels
            className={classes.stickToBottom}
          >
            <BottomNavigationAction component={Link} to="/volunteers" label="Volunteers" icon={<PeopleIcon />} />
            <BottomNavigationAction component={Link} to="/volunteerApproval" label="Approvals" icon={<EmojiPeopleIcon />} />
            <BottomNavigationAction component={Link} to="/volunteerApplications" label="Applications" icon={<AssignmentIcon />} />
            <BottomNavigationAction component={Link} to="/volunteerProgress" label="Progress" icon={<AssignmentTurnedInIcon />} />
          </BottomNavigation> : null}
        </main>
      </Router>
    </div>
  );
}

export default App;