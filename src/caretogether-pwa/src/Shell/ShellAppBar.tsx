import { useState } from 'react';
import {
  AppBar,
  Box,
  IconButton,
  Skeleton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { ShellContextSwitcher } from './ShellContextSwitcher';
import {
  screenTitleComponentState,
  screenTitleState,
} from './ShellScreenTitle';
import { useRecoilValue } from 'recoil';
import { MenuOpen } from '@mui/icons-material';
import { ShellSearchBar } from './ShellSearchBar';
import { ShellUserProfileMenu } from './ShellUserProfileMenu';

interface ShellAppBarProps {
  menuDrawerOpen: boolean;
  setMenuDrawerOpen: (value: boolean) => void;
  drawerWidth: string;
}

export function ShellAppBar({
  menuDrawerOpen,
  setMenuDrawerOpen,
  drawerWidth,
}: ShellAppBarProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [openMobileSearch, setOpenMobileSearch] = useState(true);

  const screenTitle = useRecoilValue(screenTitleState);
  const screenTitleComponent = useRecoilValue(screenTitleComponentState);

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: 1201,
        backgroundColor: theme.palette.primary.main,
        paddingLeft: isDesktop ? (menuDrawerOpen ? 0 : 0) : 0,
      }}
    >
      <Toolbar
        variant={isDesktop ? 'dense' : 'regular'}
        sx={{
          paddingLeft: isDesktop ? 0 : undefined,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {isDesktop && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {menuDrawerOpen ? (
              <Box
                sx={{ width: drawerWidth, flexShrink: 0, position: 'relative' }}
              >
                <ShellContextSwitcher />
                <IconButton
                  size={isDesktop ? 'medium' : 'large'}
                  color="inherit"
                  aria-label="close drawer"
                  sx={{ float: 'right' }}
                  onClick={() => setMenuDrawerOpen(!menuDrawerOpen)}
                >
                  <MenuOpen />
                </IconButton>
              </Box>
            ) : (
              <IconButton
                size={isDesktop ? 'medium' : 'large'}
                color="inherit"
                aria-label="open drawer"
                sx={{ marginRight: 2 }}
                onClick={() => setMenuDrawerOpen(!menuDrawerOpen)}
              >
                <MenuIcon />
              </IconButton>
            )}
            {screenTitle && (
              <Typography
                variant="h6"
                component="h3"
                noWrap
                sx={{
                  display: {
                    xs: openMobileSearch ? 'none' : 'block',
                    md: 'block',
                  },
                  marginLeft: menuDrawerOpen ? 3 : 1,
                }}
              >
                {screenTitle}
              </Typography>
            )}
            {screenTitleComponent}
            {!screenTitle && (
              <Skeleton
                variant="text"
                sx={{ fontSize: theme.typography.h6, marginLeft: 1 }}
                width={200}
              />
            )}
          </Box>
        )}
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
          <ShellSearchBar
            openMobileSearch={openMobileSearch}
            setOpenMobileSearch={setOpenMobileSearch}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ShellUserProfileMenu />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
