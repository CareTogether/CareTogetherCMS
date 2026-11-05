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
import { ShellFullscreenToggle } from './ShellFullscreenToggle';
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
  const isV2Desktop = isV2 && isDesktop;
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
        ...(isV2Desktop && {
          backgroundColor: '#FFFFFF',
          color: '#07666C',
        }),
      }}
    >
      <Toolbar
        variant={isDesktop ? 'dense' : 'regular'}
        sx={{
          paddingLeft: isDesktop ? 0 : undefined,
          display: 'flex',
          justifyContent: 'center',
          minHeight: SHELL_APP_BAR_HEIGHT,
          ...(isV2Desktop && {
            px: 3,
            py: 0.5,
            gap: 2,
            boxSizing: 'border-box',
          }),
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
                '& .MuiInputBase-input.MuiSelect-select': {
                  ...theme.typography.subtitle1,
                  fontWeight: theme.typography.fontWeightBold,
                  backgroundColor: 'transparent',
                  color: '#07666C',
                },
                '& .MuiTypography-root': {
                  ...theme.typography.subtitle1,
                  fontWeight: theme.typography.fontWeightBold,
                  color: '#07666C',
                },
                '& .MuiInputBase-input.MuiSelect-select.Mui-disabled': {
                  color: theme.palette.text.disabled,
                  WebkitTextFillColor: theme.palette.text.disabled,
                },
                '& .MuiInputBase-root .MuiSelect-icon': { color: '#07666C' },
                '& .MuiInputBase-root:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
                '& .MuiInputBase-root:focus-within': {
                  outline: '2px solid #188F97',
                  outlineOffset: 2,
                },
              }}
            >
              <ShellContextSwitcher
                contained
                showOrganization={false}
                v2DesktopPresentation={isV2Desktop}
              />
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
            ...(isV2Desktop && {
              '& .MuiContainer-root': { mr: 0 },
              '& .MuiOutlinedInput-root, & .MuiOutlinedInput-root.Mui-focused':
                {
                  backgroundColor: '#FFFFFF',
                  borderRadius: 1,
                },
              '& .MuiInputAdornment-root, & .MuiSvgIcon-root': {
                color: '#07666C',
              },
              '& input, & .MuiInputAdornment-root > .MuiSvgIcon-root': {
                color: '#000000',
              },
              '& input::placeholder': { color: theme.palette.text.secondary },
              '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
                borderColor: '#000000',
              },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                { borderColor: '#000000' },
            }),
          }}
        >
          <ShellSearchBar
            v2DesktopPresentation={isV2Desktop}
            openMobileSearch={openMobileSearch}
            setOpenMobileSearch={setOpenMobileSearch}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            ...(isV2Desktop && {
              '& .MuiIconButton-root[aria-label="user account"]': {
                width: 36,
                height: 36,
              },
            }),
          }}
        >
          <ShellFullscreenToggle />
          <ShellUserProfileMenu />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
