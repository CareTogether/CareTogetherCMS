import React from 'react';
import clsx from 'clsx';
import { fade, makeStyles } from '@material-ui/core/styles';
import { Typography, CssBaseline, IconButton, Drawer, Divider, List, BottomNavigation, BottomNavigationAction, useMediaQuery, useTheme } from '@material-ui/core';
import PermPhoneMsgIcon from '@material-ui/icons/PermPhoneMsg';
import PeopleIcon from '@material-ui/icons/People';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import DashboardIcon from '@material-ui/icons/Dashboard';
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
import Header from './Components/Header';
import { Dashboard } from './Components/Dashboard';

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
    <ListItemLink to="/dashboard" primary="Dashboard" icon={<DashboardIcon />} />
    <ListItemLink to="/referrals" primary="Referrals" icon={<PermPhoneMsgIcon />} />
  </List>
);

const secondaryListItems = (
  <List aria-label="secondary navigation">
    <ListItemLink to="/volunteers" primary="Volunteers" icon={<PeopleIcon />} />
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
        <Header open={open} handleDrawerOpen={handleDrawerOpen} />
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
              <Route path="/dashboard">
                <Dashboard />
              </Route>
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
        </main>
        {isMobile ? <BottomNavigation
          value={selectedBottomNavAction}
          onChange={(_, newValue) => {
            setSelectedBottomNavAction(newValue);
          }}
          showLabels
          className={classes.stickToBottom}
        >
          <BottomNavigationAction component={Link} to="/dashboard" label="Dashboard" icon={<DashboardIcon />} />
          <BottomNavigationAction component={Link} to="/referrals" label="Referrals" icon={<PermPhoneMsgIcon />} />
          <BottomNavigationAction component={Link} to="/volunteers" label="Volunteers" icon={<PeopleIcon />} />
        </BottomNavigation> : null}
      </Router>
    </div>
  );
}

export default App;