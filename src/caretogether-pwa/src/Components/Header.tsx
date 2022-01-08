import React from 'react';
import clsx from 'clsx';
import { AppBar, Toolbar, IconButton, Typography, useMediaQuery, useTheme, Portal } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import MenuIcon from '@material-ui/icons/Menu';
import { HeaderContext } from './HeaderContext';

const drawerWidth = 200;

type HeaderTitleProps = {}
export const HeaderTitle: React.FC<HeaderTitleProps> = ({ children }) => (
  <Typography component="h1" variant="h6" color="inherit" noWrap style={{flexGrow: 1}}>
    {children}
  </Typography>
);

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
  appBarPortal: {
    width: '100%',
    height: '100%',
    display: 'flex'
  }
}));

type HeaderContentProps = {}
export const HeaderContent: React.FC<HeaderContentProps> = ({ children }) => (
  <HeaderContext.Consumer>
    {headerContainer =>
      <Portal container={headerContainer?.current}>
        {children}
      </Portal>}
  </HeaderContext.Consumer>
);

interface HeaderProps {
  open: boolean,
  handleDrawerOpen: () => void;
}

function Header(props: HeaderProps) {
  const { open, handleDrawerOpen } = props;

  const classes = useStyles();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
        <HeaderContext.Consumer>
          {headerContainer => <div ref={headerContainer} className={classes.appBarPortal} />}
        </HeaderContext.Consumer>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
