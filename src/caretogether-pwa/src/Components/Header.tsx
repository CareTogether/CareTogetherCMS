import React from 'react';
import clsx from 'clsx';
import { AppBar, Toolbar, IconButton, Typography, useMediaQuery, useTheme, Button, ButtonGroup } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import MenuIcon from '@mui/icons-material/Menu';
import { Link, useLocation, useRouteMatch, useHistory } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';
import { useRecoilValue } from 'recoil';
import { volunteerFamiliesData } from '../Model/VolunteersModel';

const drawerWidth = 200;

const useStyles = makeStyles((theme) => ({
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
  appBarSpacer: {
    height: 48,
  },
  toolbar: {
    paddingRight: 24, // keep right padding when drawer closed
  },
  menuButton: {
    marginRight: 36,
  },
  menuButtonHidden: {
    display: 'none',
  },
  backButton: {
    margin: theme.spacing(1),
  },
  title: {
    flexGrow: 1,
  },
  toggleGroup: {
    flexGrow: 1
  }
}));

interface HeaderProps {
  open: boolean,
  handleDrawerOpen: () => void;
}

function Header(props: HeaderProps) {
  const { open, handleDrawerOpen } = props;

  const classes = useStyles();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dashboardMatch = useRouteMatch({
    path: '/dashboard',
  })
  const referralsMatch = useRouteMatch({
    path: '/referrals',
  })
  const volunteerListMatch = useRouteMatch({
    path: '/volunteers/:slug',
    strict: true,
    sensitive: true
  });
  const volunteerFamilyMatch = useRouteMatch<{ volunteerFamilyId: string }>({
    path: '/volunteers/family/:volunteerFamilyId',
    strict: true,
    sensitive: true
  });
  const location = useLocation();
  const history = useHistory();
  const volunteerFamilies = useRecoilValue(volunteerFamiliesData);
  const volunteerFamily = volunteerFamilyMatch && volunteerFamilies.find(x => x.family?.id === volunteerFamilyMatch.params.volunteerFamilyId);

  return (
    <AppBar position="absolute" className={clsx(classes.appBar, (open && !isMobile) && classes.appBarShift)}>
      <Toolbar className={classes.toolbar} variant="dense">
        {!isMobile && <IconButton
          edge="start"
          color="inherit"
          aria-label="open drawer"
          onClick={handleDrawerOpen}
          className={clsx(classes.menuButton, open && classes.menuButtonHidden)}
        >
          <MenuIcon />
        </IconButton>}
        {!isMobile && !volunteerFamilyMatch && <Typography component="h1" variant="h6" color="inherit" noWrap className={classes.title}>
          {dashboardMatch && "Dashboard"}
          {referralsMatch && "Referrals"}
          {!volunteerFamilyMatch && volunteerListMatch && "Volunteers"}
        </Typography>}
        {volunteerFamilyMatch && <Typography component="h1" variant="h6" color="inherit" noWrap className={classes.title}>
          <IconButton
            color="inherit"
            onClick={() => history.goBack()}
          >
            <ArrowBack />
          </IconButton>&nbsp;
          {volunteerFamily?.family?.adults!.filter(adult => adult.item1!.id === volunteerFamily!.family!.primaryFamilyContactPersonId)[0]?.item1?.lastName} Family
        </Typography>}
        {!volunteerFamilyMatch && volunteerListMatch && <ButtonGroup variant="text" color="inherit" aria-label="text inherit button group" className={classes.toggleGroup}>
          <Button color={location.pathname === "/volunteers/approval" ? 'default' : 'inherit'} component={Link} to={"/volunteers/approval"}>Approvals</Button>
          {/* <Button color={location.pathname === "/volunteers/applications" ? 'default' : 'inherit'} component={Link} to={"/volunteers/applications"}>Applications</Button> */}
          <Button color={location.pathname === "/volunteers/progress" ? 'default' : 'inherit'} component={Link} to={"/volunteers/progress"}>Progress</Button>
        </ButtonGroup>}
      </Toolbar>
    </AppBar>
  );
}

export default Header;
