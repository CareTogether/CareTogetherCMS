import { Add as AddIcon, KeyboardArrowDown } from '@mui/icons-material';
import {
  Divider,
  Button,
  ListSubheader,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  useLocationConfigurationLoadable,
  useOrganizationConfigurationLoadable,
} from '../Model/ConfigurationModel';
import {
  useCurrentOrganizationLoadable,
  useSelectedLocationContext,
} from '../Model/Data';
import { useUserIsOrganizationAdministratorLoadable } from '../Model/SessionModel';
import { useSidePanel } from '../Hooks/useSidePanel';
import { AddLocation } from '../Settings/Locations/AddLocationSidePanel';
import { locationScopedRoutes } from '../LocationScopedRoutes';
import { locationSwitchTarget } from './locationSwitchTarget';

interface ShellContextSwitcherProps {
  v2DesktopPresentation?: boolean;
  contained?: boolean;
  showOrganization?: boolean;
}

export function ShellContextSwitcher({
  v2DesktopPresentation = false,
  contained = false,
  showOrganization = true,
}: ShellContextSwitcherProps) {
  const organizationConfiguration = useOrganizationConfigurationLoadable();
  const locationConfiguration = useLocationConfigurationLoadable();
  const selectedLocationContext = useSelectedLocationContext();
  const currentOrganization = useCurrentOrganizationLoadable();
  const isOrganizationAdministrator =
    useUserIsOrganizationAdministratorLoadable();
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const {
    SidePanel: AddLocationSidePanel,
    openSidePanel: openAddLocationSidePanel,
    closeSidePanel: closeAddLocationSidePanel,
  } = useSidePanel();

  const navigate = useNavigate();
  const route = useLocation();

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const useV2Dropdown = v2DesktopPresentation && isDesktop;
  const isAppBarContext = contained && !showOrganization && isDesktop;

  const availableLocations = currentOrganization?.locations;

  const locations = organizationConfiguration?.locations!.map((location) => ({
    id: location.id!,
    name: location.name!,
    isAvailable:
      availableLocations?.some(
        (available) => available.locationId === location.id
      ) || false,
  }));

  function switchLocation(locationId: string) {
    if (!selectedLocationContext || !currentOrganization?.organizationId) {
      return;
    }

    navigate(
      locationSwitchTarget({
        routes: locationScopedRoutes,
        pathname: route.pathname,
        search: route.search,
        hash: route.hash,
        organizationId: currentOrganization.organizationId,
        currentLocationId: selectedLocationContext.locationId,
        nextLocationId: locationId,
      })
    );
  }

  function openAddLocation() {
    setIsLocationMenuOpen(false);
    openAddLocationSidePanel();
  }

  return (
    <Stack
      sx={{
        position: contained ? 'static' : 'absolute',
        minWidth: 0,
        width: contained ? '100%' : undefined,
        overflow: 'hidden',
      }}
    >
      {showOrganization &&
        (organizationConfiguration ? (
          <Typography
            className="ph-unmask"
            variant="subtitle1"
            component="h1"
            noWrap
            title={organizationConfiguration.organizationName}
            sx={{
              position: 'relative',
              top: -4,
              boxSizing: 'border-box',
              maxWidth: '100%',
              px: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {organizationConfiguration.organizationName}
          </Typography>
        ) : (
          <Skeleton
            variant="text"
            width={130}
            animation="wave"
            sx={{ marginTop: -0.5, marginLeft: 1 }}
          />
        ))}
      {locationConfiguration &&
      availableLocations &&
      locations &&
      selectedLocationContext ? (
        availableLocations.length >= 1 ? (
          <Select
            {...(useV2Dropdown && { IconComponent: KeyboardArrowDown })}
            inputProps={{ 'aria-label': 'Location' }}
            className="ph-unmask"
            size={isDesktop ? 'small' : 'medium'}
            variant={isAppBarContext ? 'standard' : 'outlined'}
            {...(isAppBarContext && { disableUnderline: true })}
            sx={{
              marginLeft: showOrganization ? 0.5 : 0,
              marginTop: showOrganization && isDesktop ? -1 : 0,
              height: isDesktop ? 24 : 56,
              minWidth: 0,
              maxWidth: '100%',
              '& .MuiInputBase-input': {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                paddingTop: isDesktop ? 0 : 2,
                paddingBottom: isDesktop ? 0 : 2,
                paddingLeft: isDesktop ? 0.5 : 2,
                paddingRight: isDesktop ? 0.5 : 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
              '.MuiSelect-iconOutlined': {
                color: theme.palette.primary.contrastText,
              },
              '& [aria-expanded=true]': {
                backgroundColor: theme.palette.primary.dark,
              },
              '& .MuiOutlinedInput-notchedOutline, .Mui-focused & .MuiOutlinedInput-notchedOutline':
                {
                  borderColor: '#fff8',
                },
              ...(isAppBarContext && {
                height: 'auto',
                borderRadius: 1,
                '& .MuiSelect-select.MuiInputBase-input': {
                  backgroundColor: 'transparent',
                  py: 0.75,
                  pl: 1,
                  pr: 4,
                },
                '& .MuiSelect-icon': {
                  color: theme.palette.primary.contrastText,
                  right: theme.spacing(0.5),
                },
                '&:hover': {
                  backgroundColor: alpha(
                    theme.palette.primary.contrastText,
                    theme.palette.action.hoverOpacity
                  ),
                },
                '& .MuiSelect-select:focus-visible': {
                  outline: `2px solid ${theme.palette.primary.contrastText}`,
                  outlineOffset: -2,
                  borderRadius: 1,
                },
              }),
              ...(useV2Dropdown && {
                '& .MuiSelect-icon': {
                  color: '#07666C',
                  fontSize: 20,
                  top: 'calc(50% - 10px)',
                },
              }),
            }}
            MenuProps={{
              slotProps: {
                paper: {
                  sx: useV2Dropdown
                    ? { backgroundColor: '#FFFFFF' }
                    : undefined,
                },
                list: {
                  sx: {
                    backgroundColor: theme.palette.primary.light,
                    color: theme.palette.primary.contrastText,
                    ...(useV2Dropdown && {
                      backgroundColor: '#FFFFFF',
                      color: theme.palette.text.primary,
                      '& .MuiMenuItem-root': {
                        '&:hover, &.Mui-focusVisible': {
                          backgroundColor: theme.palette.action.hover,
                        },
                        '&.Mui-selected': {
                          color: '#07666C',
                          backgroundColor: theme.palette.action.selected,
                          '&:hover, &.Mui-focusVisible': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        },
                      },
                    }),
                  },
                },
              },
            }}
            open={isLocationMenuOpen}
            value={selectedLocationContext.locationId}
            onChange={(e) => switchLocation(e.target.value as string)}
            onClose={() => setIsLocationMenuOpen(false)}
            onOpen={() => setIsLocationMenuOpen(true)}
          >
            {locations.map((location) => (
              <MenuItem
                key={location.id}
                value={location.id}
                disabled={!location.isAvailable}
              >
                {location.name}
              </MenuItem>
            ))}
            {isOrganizationAdministrator && (
              <ListSubheader
                disableGutters
                disableSticky
                sx={{ backgroundColor: 'inherit', color: 'inherit', px: 0 }}
              >
                <Divider
                  sx={{
                    borderColor: useV2Dropdown
                      ? theme.palette.divider
                      : alpha(
                          theme.palette.primary.contrastText,
                          theme.palette.action.disabledOpacity
                        ),
                    my: 0.5,
                  }}
                />
                <Button
                  color="inherit"
                  fullWidth
                  startIcon={<AddIcon />}
                  sx={{
                    ...(useV2Dropdown && { color: '#07666C' }),
                    '&:hover': {
                      backgroundColor: useV2Dropdown
                        ? theme.palette.action.hover
                        : alpha(
                            theme.palette.primary.contrastText,
                            theme.palette.action.hoverOpacity
                          ),
                    },
                    ...(useV2Dropdown && {
                      '&.Mui-focusVisible': {
                        backgroundColor: theme.palette.action.focus,
                      },
                    }),
                    justifyContent: 'flex-start',
                    px: 2,
                    py: 1,
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    openAddLocation();
                  }}
                >
                  Add New Location
                </Button>
              </ListSubheader>
            )}
          </Select>
        ) : (
          <Typography
            variant="subtitle2"
            component="h2"
            noWrap
            title={locationConfiguration.name}
            sx={{
              position: 'relative',
              top: showOrganization ? -8 : 0,
              boxSizing: 'border-box',
              maxWidth: '100%',
              px: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {locationConfiguration.name}
          </Typography>
        )
      ) : (
        <Skeleton
          variant="text"
          width={130}
          animation="wave"
          sx={{ marginLeft: 1 }}
        />
      )}
      <AddLocationSidePanel>
        <AddLocation onClose={closeAddLocationSidePanel} />
      </AddLocationSidePanel>
    </Stack>
  );
}
