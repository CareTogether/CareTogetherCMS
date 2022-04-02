import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { Typography, CssBaseline, IconButton, Drawer, Divider, List, useMediaQuery, useTheme } from '@mui/material';
import PermPhoneMsgIcon from '@mui/icons-material/PermPhoneMsg';
import PeopleIcon from '@mui/icons-material/People';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
//import DashboardIcon from '@mui/icons-material/Dashboard';
import { BrowserRouter as Router } from "react-router-dom";
import { ListItemLink } from './Components/ListItemLink';
import { useFeatureFlags } from './Model/ConfigurationModel';
import Header from './Components/Header';
import { Footer } from './Components/Footer';
import { CurrentFeatureFlags } from './GeneratedClient';
import { HeaderContext } from './Components/HeaderContext';
import { AppRoutes } from './AppRoutes';
import { LocationSwitcher } from './Components/LocationSwitcher';

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
  }
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
              classes={{ paper: open ? classes.drawerPaperOpen : classes.drawerPaperClose }}
              open={open}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 8px',
              }}>
                {isMobile ? null : <LocationSwitcher />}
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
          <main style={{
            flexGrow: 1,
            height: isMobile ? `calc(100vh - 56px)` : '100vh', // subtract bottom navigation height on mobile
            overflow: 'auto'
          }}>
            <div style={{height: 48 /* Offset main content from page top by the header height amount */}} />
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