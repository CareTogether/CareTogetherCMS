import { useState } from 'react';
import { AppBar, Box, IconButton, Skeleton, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { ShellContextSwitcher } from './ShellContextSwitcher';
import { screenTitleState } from './ShellScreenTitle';
import { useRecoilValue } from 'recoil';

interface ShellAppBarProps {
  menuDrawerOpen: boolean
  setMenuDrawerOpen: (value: boolean) => void
  drawerWidth: string
}
export function ShellAppBar({ menuDrawerOpen, setMenuDrawerOpen, drawerWidth }: ShellAppBarProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [openMobileSearch, /*setOpenMobileSearch*/] = useState(false);

  const screenTitle = useRecoilValue(screenTitleState);

  return (
    <AppBar position='fixed' sx={{
      zIndex: 1201,
      backgroundColor: theme.palette.primary.main,
      paddingLeft: isDesktop ? (menuDrawerOpen ? 0 : 0) : 0
    }}>
      <Toolbar variant={isDesktop ? 'dense' : 'regular'}
        style={{ paddingLeft: isDesktop ? 0 : undefined }}>
        {isDesktop && (menuDrawerOpen
          ? <Box sx={{ width: drawerWidth, flexShrink: 0, position: 'relative' }}>
            <ShellContextSwitcher />
            <IconButton
              size={isDesktop ? 'medium' : 'large'}
              color='inherit'
              aria-label="close drawer"
              sx={{ float: 'right' }}
              onClick={() => setMenuDrawerOpen(!menuDrawerOpen)}
            >
              <ChevronLeftIcon />
            </IconButton>
          </Box>
          : <IconButton
            size={isDesktop ? 'medium' : 'large'}
            color='inherit'
            aria-label="open drawer"
            sx={{ marginRight: 2, width: drawerWidth }}
            onClick={() => setMenuDrawerOpen(!menuDrawerOpen)}
          >
            <MenuIcon />
          </IconButton>)}
        {screenTitle
          ? <Typography variant='h6' component="h3" noWrap sx={{
                display: { xs: openMobileSearch ? 'none' : 'block', md: 'block' },
                marginLeft: isDesktop ? (menuDrawerOpen ? 3 : 1) : 0
              }}>
              {screenTitle}
            </Typography>
          : <Skeleton variant="text" sx={{fontSize: theme.typography.h6, marginLeft: 1}} width={200} />}
        {/* <ShellSearchBar
          openMobileSearch={openMobileSearch}
          setOpenMobileSearch={setOpenMobileSearch} /> */}
        {/* <ShellUserProfileMenu /> */}
      </Toolbar>
    </AppBar>
  );
}
