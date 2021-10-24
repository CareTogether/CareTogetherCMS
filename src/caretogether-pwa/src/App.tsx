import React from 'react';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, CssBaseline, IconButton, Drawer, Divider, List, useMediaQuery, useTheme } from '@material-ui/core';
//import PermPhoneMsgIcon from '@material-ui/icons/PermPhoneMsg';
import { Typography, CssBaseline, IconButton, Drawer, Divider, List, useMediaQuery, useTheme, Backdrop, Button, CircularProgress } from '@material-ui/core';
import PermPhoneMsgIcon from '@material-ui/icons/PermPhoneMsg';
import PeopleIcon from '@material-ui/icons/People';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
//import DashboardIcon from '@material-ui/icons/Dashboard';
import { Route, Switch, Redirect, BrowserRouter as Router } from "react-router-dom";
import { ListItemLink } from './Components/ListItemLink';
import { Arrangements } from './Components/Arrangements';
import { Referrals } from './Components/Referrals';
import { atom, useRecoilState, useRecoilValue } from 'recoil';
import { locationNameData, organizationNameData } from './Model/ConfigurationModel';
import { Volunteers } from './Components/Volunteers';
import Header from './Components/Header';
import { Dashboard } from './Components/Dashboard';
import Footer from './Components/Footer';

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
  backdrop: {
    color: '#fff',
    zIndex: theme.zIndex.drawer +1
  },
}));

const mainListItems = (
  <List aria-label="main navigation">
    {/* <ListItemLink to="/dashboard" primary="Dashboard" icon={<DashboardIcon />} /> */}
  </List>
);

const secondaryListItems = (
  <List aria-label="secondary navigation">
    {/* <ListItemLink to="/referrals" primary="Referrals" icon={<PermPhoneMsgIcon />} /> */}
    <ListItemLink to="/volunteers" primary="Volunteers" icon={<PeopleIcon />} />
  </List>
);

export const backdropState = atom({
  key: 'backdropState', // unique ID (with respect to other atoms/selectors)
  default: false, // default value (aka initial value)
});

export const AsyncWrapper = async (asyncFunction: (...asyncArguments: any) => Promise<any>, ...args: any) => {
  try {
    const [_, setBackdropOpen] = useRecoilState(backdropState);
    setBackdropOpen(true);
    const results = await asyncFunction(...args);
    setBackdropOpen(false);
    return results;
  }
  catch (error) {
    return [null, error];
  }
}

function App() {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const handleDrawerOpen = () => {
    setOpen(true);
  };
  const handleDrawerClose = () => {
    setOpen(false);
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const organizationName = useRecoilValue(organizationNameData);
  const locationName = useRecoilValue(locationNameData);

  // const [backdropOpen, setBackdropOpen] = React.useState(false);
  const [backdropOpen, setBackdropOpen] = useRecoilState(backdropState);
  const handleBackdropClose = () => {
    setBackdropOpen(false);
  };
  const handleToggle = () => {
    setBackdropOpen(!open);
  };

  return (
    <div className={classes.root}>
      <CssBaseline />
      <Router>
        <Button onClick={handleToggle}>Show backdrop</Button>
        <Backdrop
          className={classes.backdrop}
          open={backdropOpen}
          onClick={handleBackdropClose}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
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
              <Route>
                <Redirect to="/volunteers" />
              </Route>
            </Switch>
          </React.Suspense>
          {isMobile && <Footer></Footer>}
        </main>
      </Router>
    </div>
  );
}

export default App;