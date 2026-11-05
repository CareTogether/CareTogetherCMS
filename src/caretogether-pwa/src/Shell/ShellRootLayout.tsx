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
import { ThemeProvider } from '@mui/material/styles';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG } from '../featureFlags';
import { v2TypographyTheme } from '../v2TypographyTheme';
import { ProgressBackdrop } from './ProgressBackdrop';
import { useGlobalSnackBar } from '../Hooks/useGlobalSnackBar';
import {
  COLLAPSED_DRAWER_WIDTH,
  DESKTOP_BOTTOM_SAFE_AREA,
  EXPANDED_DRAWER_WIDTH,
  MOBILE_BOTTOM_SAFE_AREA,
  SHELL_APP_BAR_HEIGHT,
  V2_DESKTOP_APP_BAR_HEIGHT,
} from './shellLayoutConstants';

function ShellRootLayout({ children }: React.PropsWithChildren) {
  const theme = useTheme();
  const isV2 =
    useFeatureFlagEnabled(FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG) === true;

  return (
    <ThemeProvider theme={isV2 ? v2TypographyTheme : theme}>
      <ShellLayoutContent isV2={isV2}>{children}</ShellLayoutContent>
    </ThemeProvider>
  );
}

function ShellLayoutContent({
  children,
  isV2,
}: React.PropsWithChildren<{ isV2: boolean }>) {
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
    <Box
      sx={{
        flexGrow: 1,
        fontFamily: theme.typography.fontFamily,
        ...(isV2 && {
          '--shell-desktop-app-bar-height': `${V2_DESKTOP_APP_BAR_HEIGHT}px`,
        }),
      }}
    >
      <ShellAppBar
        menuDrawerOpen={menuDrawerOpen}
        setMenuDrawerOpen={setMenuDrawerOpen}
        drawerWidth={drawerWidth + 'px'}
      />
      {isDesktop && (
        <ShellSideNavigation
          open={menuDrawerOpen}
          width={drawerWidth}
          isV2={isV2}
        />
      )}
      <Box
        sx={{
          flexGrow: 1,
          marginLeft: isDesktop ? drawerWidth + 'px' : undefined,
          ...(isV2 && {
            isolation: 'isolate',
            '&::before': {
              content: '""',
              position: 'fixed',
              top: SHELL_APP_BAR_HEIGHT,
              left: isDesktop ? drawerWidth : 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(38, 163, 171, 0.08)',
              pointerEvents: 'none',
              zIndex: -1,
            },
          }),
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
            backgroundColor: isV2 ? 'transparent' : '#fff',
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
