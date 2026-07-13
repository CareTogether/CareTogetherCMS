import {
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useLoadable } from '../Hooks/useLoadable';
import {
  locationConfigurationQuery,
  organizationConfigurationQuery,
} from '../Model/ConfigurationModel';
import {
  currentOrganizationQuery,
  selectedLocationContextState,
} from '../Model/Data';

interface ShellContextSwitcherProps {
  contained?: boolean;
}

export function ShellContextSwitcher({
  contained = false,
}: ShellContextSwitcherProps) {
  const organizationConfiguration = useLoadable(organizationConfigurationQuery);
  const locationConfiguration = useLoadable(locationConfigurationQuery);
  const selectedLocationContext = useLoadable(selectedLocationContextState);
  const currentOrganization = useLoadable(currentOrganizationQuery);

  const navigate = useNavigate();

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

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
    navigate(`/org/${currentOrganization!.organizationId!}/${locationId}/`);
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
      {organizationConfiguration ? (
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
      )}
      {locationConfiguration &&
      availableLocations &&
      locations &&
      selectedLocationContext ? (
        availableLocations.length >= 1 ? (
          <Select
            className="ph-unmask"
            size={isDesktop ? 'small' : 'medium'}
            variant="outlined"
            sx={{
              marginLeft: 0.5,
              marginTop: isDesktop ? -1 : 0,
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
            }}
            MenuProps={{
              slotProps: {
                list: {
                  sx: {
                    backgroundColor: theme.palette.primary.light,
                    color: theme.palette.primary.contrastText,
                  },
                },
              },
            }}
            value={selectedLocationContext.locationId}
            onChange={(e) => switchLocation(e.target.value as string)}
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
          </Select>
        ) : (
          <Typography
            variant="subtitle2"
            component="h2"
            noWrap
            title={locationConfiguration.name}
            sx={{
              position: 'relative',
              top: -8,
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
    </Stack>
  );
}
