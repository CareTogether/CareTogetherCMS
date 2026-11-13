import { Alert, Stack, Typography } from '@mui/material';
import {
  Navigate,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useOrganizationConfiguration } from '../../Model/ConfigurationModel';
import { useRequiredSelectedLocationContext } from '../../Model/Data';
import { useGlobalPermissions } from '../../Model/SessionModel';
import { Permission } from '../../GeneratedClient';
import { useScreenTitle } from '../../Shell/ShellScreenTitle';
import { Breadcrumbs } from '../../Generic/Breadcrumbs';
import BasicConfiguration from './Tabs/BasicConfiguration';
import {
  legacySettingsTarget,
  settingsCategoryBreadcrumb,
} from '../settingsSections';

export function LocationEdit() {
  const { editingLocationId } = useParams<{ editingLocationId: string }>();
  const [search] = useSearchParams();
  const route = useLocation();
  const { organizationId, locationId } = useRequiredSelectedLocationContext();
  const configuration = useOrganizationConfiguration();
  const permissions = useGlobalPermissions();
  const targetLocationId = editingLocationId ?? locationId;
  const location = configuration?.locations?.find(
    (item) => item.id === targetLocationId
  );
  useScreenTitle('Location configuration');
  const legacyTarget = legacySettingsTarget(
    organizationId,
    locationId,
    editingLocationId,
    search.get('tab')
  );
  if (legacyTarget) {
    const remaining = new URLSearchParams(search);
    remaining.delete('tab');
    const query = remaining.toString();
    return (
      <Navigate
        to={legacyTarget + (query ? '?' + query : '') + route.hash}
        replace
      />
    );
  }
  if (!permissions(Permission.AccessSettingsScreen) || !location)
    return (
      <Alert severity="error">
        This location is restricted or unavailable.
      </Alert>
    );
  const data = {
    name: location.name,
    ethnicities: location.ethnicities ?? [],
    adultFamilyRelationships: location.adultFamilyRelationships ?? [],
    arrangementReasons: location.arrangementReasons ?? [],
    caseCloseReasons: configuration?.caseCloseReasons ?? [],
    referralCloseReasons: configuration?.referralCloseReasons ?? [],
  };
  return (
    <Stack spacing={2} sx={{ minWidth: 0, py: 2 }}>
      <Breadcrumbs
        items={[
          {
            label: 'Settings',
            to: '/org/' + organizationId + '/' + locationId + '/settings',
          },
          settingsCategoryBreadcrumb(organizationId, locationId, 'locations'),
        ]}
        currentPageLabel="Location"
      />
      <Typography variant="h5" component="h1">
        Editing {location.name} configuration
      </Typography>
      <BasicConfiguration
        key={organizationId + '/' + targetLocationId}
        data={data}
        currentLocationDefinition={location}
      />
    </Stack>
  );
}
