import React from 'react';
import clsx from 'clsx';
import makeStyles from '@mui/styles/makeStyles';
import { Typography, CssBaseline, IconButton, Drawer, Divider, List, useMediaQuery, useTheme } from '@mui/material';
import PermPhoneMsgIcon from '@mui/icons-material/PermPhoneMsg';
import PeopleIcon from '@mui/icons-material/People';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
//import DashboardIcon from '@mui/icons-material/Dashboard';
import { BrowserRouter as Router } from "react-router-dom";
import { ListItemLink } from './Components/ListItemLink';
import { useRecoilValue } from 'recoil';
import { locationNameData, organizationNameData, useFeatureFlags } from './Model/ConfigurationModel';
import Header from './Components/Header';
import { Footer } from './Components/Footer';
import { CurrentFeatureFlags } from './GeneratedClient';
import { HeaderContext } from './Components/HeaderContext';
import { AppRoutes } from './AppRoutes';

function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center" sx={{lineHeight: '3em'}}>
      {' © '} {new Date().getFullYear()} &nbsp;
      <a color="inherit" href="https://caretogether.io/" target="_blank" rel="noreferrer">
        CareTogether CMS
      </a><br />
    </Typography>
  );
}

const useStyles = makeStyles((theme) => ({
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
  content: {
    flexGrow: 1,
    height: '100vh',
    overflow: 'auto',
  },
  mobileContent: {
    flexGrow: 1,
    height: `calc(100vh - 56px)`, // subtract footer height
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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const organizationName = useRecoilValue(organizationNameData);
  const locationName = useRecoilValue(locationNameData);

  const featureFlags = useFeatureFlags();

  const headerContainer = React.useRef(null);

  return (
    <div style={{display: 'flex'}}>
      <CssBaseline />
      <HeaderContext.Provider value={headerContainer}>
        {/* <Router> needs to be defined after the <HeaderContext.Provider> and before <Header> to link it correctly */}
        <Router>
          <Header open={open} handleDrawerOpen={handleDrawerOpen} />
          {isMobile ? null :
            <Drawer
              variant="permanent"
              sx={{
                position: 'relative',
                whiteSpace: 'nowrap',
                width: 200, // drawer width
                transition: theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
              }}
              classes={{
                paper: clsx(!open && classes.drawerPaperClose),
              }}
              open={open}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 8px',
              }}>
                {isMobile ? null : <header>
                  <p style={{
                    margin: '0',
                    paddingLeft: '8px',
                    fontSize: '16px'
                  }}>{organizationName}</p>
                  <p style={{
                    margin: '0',
                    paddingLeft: '8px',
                    fontSize: '14px'
                  }}>{locationName}</p>
                </header>}
                <IconButton onClick={handleDrawerClose} size="large">
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
            <div style={{height: 48}} />
            <React.Suspense fallback={<div>Loading...</div>}>
              <AppRoutes />
            </React.Suspense>
          </main>
          {isMobile && <Footer></Footer>}
        </Router>
      </HeaderContext.Provider>
    </div>
  );
}

export default App;