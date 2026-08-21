import { useEffect } from 'react';
import posthog from 'posthog-js';
import {
  useLocationConfiguration,
  useOrganizationConfiguration,
} from '../../Model/ConfigurationModel';
import { useParams } from 'react-router-dom';

export const usePostHogGroups = () => {
  const { organizationId, locationId } = useParams<{
    organizationId: string;
    locationId: string;
  }>();

  const organizationConfiguration = useOrganizationConfiguration();
  const locationConfiguration = useLocationConfiguration();

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
