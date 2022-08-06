import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, useMediaQuery, useTheme, Portal } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import { HeaderContext } from './HeaderContext';

type HeaderTitleProps = { children?: React.ReactNode }
export const HeaderTitle: React.FC<HeaderTitleProps> = ({ children }) => (
  <Typography component="h1" variant="h6" color="inherit" noWrap style={{flexGrow: 1}}>
    {children}
  </Typography>
);

type HeaderContentProps = { children?: React.ReactNode }
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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const drawerWidth = 200;

  const appBarStyle = {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    })
  };
  const appBarShiftStyle = {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    })
  };

  return (
    <AppBar position="absolute" sx={{...appBarStyle, ...((open && !isMobile) ? appBarShiftStyle : {})}}>
      <Toolbar sx={{paddingRight: '24px' /*keep right padding when drawer closed*/}} variant="dense">
        {!isMobile && <IconButton
          edge="start"
          color="inherit"
          aria-label="open drawer"
          onClick={handleDrawerOpen}
          sx={{marginRight: '36px', display: open ? 'none' : null}}
          size="large">
          <MenuIcon />
        </IconButton>}
        <HeaderContext.Consumer>
          {headerContainer => <div ref={headerContainer} style={{ width: '100%', height: '100%', display: 'flex'}} />}
        </HeaderContext.Consumer>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
