import React from 'react';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, CssBaseline, IconButton, Drawer, Divider, List, useMediaQuery, useTheme } from '@material-ui/core';
import PermPhoneMsgIcon from '@mui/icons-material/PermPhoneMsg';
import PeopleIcon from '@mui/icons-material/People';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
//import DashboardIcon from '@mui/icons-material/Dashboard';
import { Route, Switch, Redirect, BrowserRouter as Router } from "react-router-dom";
import { ListItemLink } from './Components/ListItemLink';
import { Arrangements } from './Components/Referrals/Arrangements';
import { Referrals } from './Components/Referrals/Referrals';
import { useRecoilValue } from 'recoil';
import { locationNameData, organizationNameData, useFeatureFlags } from './Model/ConfigurationModel';
import { Volunteers } from './Components/Volunteers/Volunteers';
import Header from './Components/Header';
import { Dashboard } from './Components/Dashboard';
import Footer from './Components/Footer';
import { CurrentFeatureFlags } from './GeneratedClient';

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
const footerHeight = 56;

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
  mobileContent: {
    flexGrow: 1,
    height: `calc(100vh - ${footerHeight}px)`,
    overflow: 'auto',
  },
}));

const mainListItems = (flags: CurrentFeatureFlags) => (
  <List aria-label="main navigation">
    {/* <ListItemLink to="/dashboard" primary="Dashboard" icon={<DashboardIcon />} /> */}
  </List>
);

const secondaryListItems = (flags: CurrentFeatureFlags) => (
  <List aria-label="secondary navigation">
    {flags.viewReferrals && <ListItemLink to="/referrals" primary="Referrals" icon={<PermPhoneMsgIcon />} />}
    <ListItemLink to="/volunteers" primary="Volunteers" icon={<PeopleIcon />} />
  </List>
);

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

  const featureFlags = useFeatureFlags();

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
            {mainListItems(featureFlags)}
            <Divider />
            {secondaryListItems(featureFlags)}
            <Divider />
            {open && <Copyright />}
          </Drawer>}
        <main className={isMobile ? classes.mobileContent : classes.content}>
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
        </main>
        {isMobile && <Footer></Footer>}
      </Router>
    </div>
  );
}

export default App;