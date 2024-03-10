import { Box, Container, useMediaQuery, useTheme } from '@mui/material';
import { ShellBottomNavigation } from './ShellBottomNavigation';
import { ShellAppBar } from './ShellAppBar';
import { ShellSideNavigation } from './ShellSideNavigation';
import { useLocalStorage } from '../Hooks/useLocalStorage';
import React from 'react';
import { ProgressBackdrop } from './ProgressBackdrop';

function ShellRootLayout({ children }: React.PropsWithChildren) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [menuDrawerOpen, setMenuDrawerOpen] = useLocalStorage('menuDrawerOpen', isDesktop);

  const drawerWidth = menuDrawerOpen ? 190 : 48;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <ShellAppBar menuDrawerOpen={menuDrawerOpen} setMenuDrawerOpen={setMenuDrawerOpen}
        drawerWidth={drawerWidth + 'px'} />
      {isDesktop && <ShellSideNavigation open={menuDrawerOpen} width={drawerWidth} />}
      <Box sx={{ flexGrow: 1, marginLeft: isDesktop ? drawerWidth + 'px' : null }}>
        <Container maxWidth={false} sx={{
          marginTop: { xs: 7, sm: 8, md: 6 },
          marginBottom: isDesktop ? 0 : 7,
          paddingBottom: isDesktop ? 0 : 7,
          backgroundColor: '#fff'
        }}>
          <React.Suspense fallback={
            <ProgressBackdrop opaque>
              <p>Loading...</p>
            </ProgressBackdrop>}>
            {children}
          </React.Suspense>
        </Container>
      </Box>
      {!isDesktop && <ShellBottomNavigation />}
    </Box>
  );
}

export default ShellRootLayout;
