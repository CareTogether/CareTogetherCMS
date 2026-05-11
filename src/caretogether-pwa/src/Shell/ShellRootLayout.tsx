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
import { DESKTOP_BOTTOM_SAFE_AREA, MOBILE_BOTTOM_SAFE_AREA } from './safeAreas';

function ShellRootLayout({ children }: React.PropsWithChildren) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [menuDrawerOpen, setMenuDrawerOpen] = useLocalStorage(
    'menuDrawerOpen',
    isDesktop
  );

  const drawerWidth = menuDrawerOpen ? 190 : 48;

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
            marginTop: { xs: 7, sm: 8, md: 6 },
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
