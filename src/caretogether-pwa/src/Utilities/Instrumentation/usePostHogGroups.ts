import { useEffect } from 'react';
import posthog from 'posthog-js';
import {
  useLocationConfigurationLoadable,
  useOrganizationConfigurationLoadable,
} from '../../Model/ConfigurationModel';
import { useParams } from 'react-router-dom';

export const usePostHogGroups = () => {
  const { organizationId, locationId } = useParams<{
    organizationId: string;
    locationId: string;
  }>();

  const organizationConfiguration = useOrganizationConfigurationLoadable();
  const locationConfiguration = useLocationConfigurationLoadable();

  useEffect(() => {
    if (organizationId) {
      posthog.group('organization', organizationId, {
        name: organizationConfiguration?.organizationName,
      });
    }

    if (organizationId && locationId) {
      posthog.group('location', locationId, {
        name: locationConfiguration?.name,
      });
    }
  }, [
    organizationId,
    locationId,
    organizationConfiguration?.organizationName,
    locationConfiguration?.name,
  ]);
};
