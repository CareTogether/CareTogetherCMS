import {
  Box,
  CircularProgress,
  Container,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  LocationOn as LocationOnIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import type { OrganizationConfiguration, UserAccess } from '../GeneratedClient';
import type { LocationContext } from '../Model/Data';
import { api } from '../Api/Api';
import { accessibleLocationContexts } from './accessRouteHelpers';

type LocationAccessScreenProps = {
  userOrganizationAccess: UserAccess;
  requestedLocationContext: LocationContext | null;
  toLocationPath: (locationContext: LocationContext) => string;
};

type OrganizationDisplayInfo = {
  name: string;
  locationNames: Map<string, string>;
};

function displayGuid(value: string) {
  return value.length > 8 ? value.substring(0, 8) : value;
}

function configDisplayInfo(
  organizationId: string,
  configuration: OrganizationConfiguration | null
): OrganizationDisplayInfo {
  return {
    name:
      configuration?.organizationName ||
      `Organization ${displayGuid(organizationId)}`,
    locationNames: new Map(
      configuration?.locations
        ?.filter((location) => location.id)
        .map((location) => [
          location.id!,
          location.name || `Location ${displayGuid(location.id!)}`,
        ]) ?? []
    ),
  };
}

export function LocationAccessScreen({
  userOrganizationAccess,
  requestedLocationContext,
  toLocationPath,
}: LocationAccessScreenProps) {
  const [configuration, setConfiguration] =
    useState<OrganizationConfiguration | null>(null);
  const [loadingConfigurations, setLoadingConfigurations] = useState(false);

  const currentOrganizationId = requestedLocationContext?.organizationId;

  const locationOptions = useMemo(() => {
    if (!currentOrganizationId) {
      return [];
    }

    return accessibleLocationContexts(userOrganizationAccess).filter(
      (locationOption) =>
        locationOption.organizationId === currentOrganizationId
    );
  }, [currentOrganizationId, userOrganizationAccess]);

  useEffect(() => {
    let cancelled = false;

    if (!currentOrganizationId) {
      setConfiguration(null);
      setLoadingConfigurations(false);
      return;
    }

    setLoadingConfigurations(true);
    api.configuration
      .getOrganizationConfiguration(currentOrganizationId)
      .then((result) => {
        if (cancelled) {
          return;
        }

        setConfiguration(result);
        setLoadingConfigurations(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setConfiguration(null);
        setLoadingConfigurations(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentOrganizationId]);

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, sm: 10 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Choose a location
            </Typography>
            <Typography color="text.secondary">
              {requestedLocationContext
                ? 'The location in this link is not available for your account. Choose another location to continue.'
                : 'Choose a location to continue.'}
            </Typography>
          </Box>

          {loadingConfigurations && (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size={18} />
              <Typography color="text.secondary">
                Loading locations...
              </Typography>
            </Stack>
          )}

          <List disablePadding>
            {locationOptions.map((locationOption) => {
              const organization = configDisplayInfo(
                locationOption.organizationId,
                configuration
              );
              const locationName =
                organization.locationNames.get(locationOption.locationId) ??
                `Location ${displayGuid(locationOption.locationId)}`;

              return (
                <ListItem
                  key={`${locationOption.organizationId}:${locationOption.locationId}`}
                  disablePadding
                >
                  <ListItemButton
                    component={RouterLink}
                    to={toLocationPath(locationOption)}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemIcon>
                      <LocationOnIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={locationName}
                      secondary={organization.name}
                      primaryTypographyProps={{ className: 'ph-unmask' }}
                      secondaryTypographyProps={{ className: 'ph-unmask' }}
                    />
                    <ArrowForwardIcon color="action" />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Stack>
      </Paper>
    </Container>
  );
}
