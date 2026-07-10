import {
  Box,
  Container,
  Snackbar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ShellBottomNavigation } from './ShellBottomNavigation';
import { ShellAppBar } from './ShellAppBar';
import { ShellSideNavigation } from './ShellSideNavigation';
import { useLocalStorage } from '../Hooks/useLocalStorage';
import { useFeaturebase } from '../Hooks/useFeaturebase';
import React from 'react';
import { ProgressBackdrop } from './ProgressBackdrop';
import { useGlobalSnackBar } from '../Hooks/useGlobalSnackBar';
import {
  COLLAPSED_DRAWER_WIDTH,
  DESKTOP_BOTTOM_SAFE_AREA,
  EXPANDED_DRAWER_WIDTH,
  MOBILE_BOTTOM_SAFE_AREA,
  SHELL_APP_BAR_HEIGHT,
} from './shellLayoutConstants';

function ShellRootLayout({ children }: React.PropsWithChildren) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [menuDrawerOpen, setMenuDrawerOpen] = useLocalStorage(
    'menuDrawerOpen',
    isDesktop
  );

  const drawerWidth = menuDrawerOpen
    ? EXPANDED_DRAWER_WIDTH
    : COLLAPSED_DRAWER_WIDTH;

  const { message, resetSnackBar } = useGlobalSnackBar();

  // Initialize Featurebase across the entire app

  useFeaturebase();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <ShellAppBar
        menuDrawerOpen={menuDrawerOpen}
        setMenuDrawerOpen={setMenuDrawerOpen}
        drawerWidth={drawerWidth + 'px'}
      />
      {isDesktop && (
        <ShellSideNavigation open={menuDrawerOpen} width={drawerWidth} />
      )}
      <Box
        sx={{
          flexGrow: 1,
          marginLeft: isDesktop ? drawerWidth + 'px' : undefined,
        }}
      >
        <Container
          maxWidth={false}
          sx={{
            marginTop: SHELL_APP_BAR_HEIGHT,
            px: { xs: 2, sm: 3 },
            paddingBottom: {
              xs: `${MOBILE_BOTTOM_SAFE_AREA}px`,
              md: `${DESKTOP_BOTTOM_SAFE_AREA}px`,
            },
            backgroundColor: '#fff',
          }}
        >
          <React.Suspense
            fallback={
              <ProgressBackdrop opaque>
                <p>Loading...</p>
              </ProgressBackdrop>
            }
          >
            {children}
          </React.Suspense>
        </Container>
      </Box>
      {!isDesktop && <ShellBottomNavigation />}

      <Snackbar
        key={message}
        open={Boolean(message)}
        autoHideDuration={5000}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        message={message}
        onClose={resetSnackBar}
      />
    </Box>
  );
}

export default ShellRootLayout;
