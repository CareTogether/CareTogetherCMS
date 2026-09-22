import { useState } from 'react';
import { Menu as MenuIcon, MenuOpen } from '@mui/icons-material';
import {
  AppBar,
  Box,
  IconButton,
  Skeleton,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ShellContextSwitcher } from './ShellContextSwitcher';
import {
  screenTitleComponentState,
  screenTitleState,
} from './ShellScreenTitle';
import { useAtomValue } from 'jotai';
import { ShellSearchBar } from './ShellSearchBar';
import { ShellUserProfileMenu } from './ShellUserProfileMenu';
import {
  COLLAPSED_DRAWER_WIDTH,
  SHELL_APP_BAR_HEIGHT,
} from './shellLayoutConstants';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG } from '../featureFlags';

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
  const isV2 =
    useFeatureFlagEnabled(FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG) === true;
  const toggleLabel = menuDrawerOpen ? 'Collapse sidebar' : 'Expand sidebar';

  const [openMobileSearch, setOpenMobileSearch] = useState(true);

  const screenTitle = useAtomValue(screenTitleState);
  const screenTitleComponent = useAtomValue(screenTitleComponentState);

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: 1201,
        backgroundColor: theme.palette.primary.main,
        paddingLeft: isDesktop ? (menuDrawerOpen ? 0 : 0) : 0,
        minHeight: SHELL_APP_BAR_HEIGHT,
      }}
    >
      <Toolbar
        variant={isDesktop ? 'dense' : 'regular'}
        sx={{
          paddingLeft: isDesktop ? 0 : undefined,
          display: 'flex',
          justifyContent: 'center',
          minHeight: SHELL_APP_BAR_HEIGHT,
        }}
      >
        {isDesktop && isV2 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              minWidth: 0,
              flex: '0 1 auto',
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: COLLAPSED_DRAWER_WIDTH,
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Tooltip title={toggleLabel}>
                <IconButton
                  color="inherit"
                  aria-label={toggleLabel}
                  aria-expanded={menuDrawerOpen}
                  onClick={() => setMenuDrawerOpen(!menuDrawerOpen)}
                >
                  {menuDrawerOpen ? <MenuOpen /> : <MenuIcon />}
                </IconButton>
              </Tooltip>
            </Box>
            <Typography
              className="ph-unmask"
              variant="h6"
              component="span"
              noWrap
              sx={{ flexShrink: 0 }}
            >
              CareTogether
            </Typography>
            <Box
              sx={{
                minWidth: 0,
                maxWidth: theme.spacing(28),
                flex: '0 1 auto',
              }}
            >
              <ShellContextSwitcher contained showOrganization={false} />
            </Box>
          </Box>
        )}
        {isDesktop && !isV2 && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {menuDrawerOpen ? (
              <Box
                sx={{
                  width: drawerWidth,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'flex-start',
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <ShellContextSwitcher contained />
                </Box>
                <IconButton
                  size={isDesktop ? 'medium' : 'large'}
                  color="inherit"
                  aria-label="close drawer"
                  sx={{ flexShrink: 0 }}
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
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            ...(isV2 && isDesktop && { minWidth: 0 }),
          }}
        >
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
