import { useEffect } from 'react';
import { useLoadable } from './useLoadable';
import { accountInfoState } from '../Authentication/Auth';
import { selectedLocationContextState } from '../Model/Data';
import {
  organizationConfigurationQuery,
  locationConfigurationQuery,
} from '../Model/ConfigurationModel';
import { api } from '../Api/Api';
import { useGlobalPermissions } from '../Model/SessionModel';
import { Permission } from '../GeneratedClient';

// Extend the Window interface to include Featurebase
declare global {
  interface Window {
    Featurebase: {
      (...args: unknown[]): void;
      q?: unknown[];
    };
  }
}

export const useFeaturebase = () => {
  // Get user data from Recoil state
  const accountInfo = useLoadable(accountInfoState);
  const organizationConfiguration = useLoadable(organizationConfigurationQuery);
  const locationConfiguration = useLoadable(locationConfigurationQuery);
  const locationContext = useLoadable(selectedLocationContextState);

  // Check if user has permission to access support screen
  const permissions = useGlobalPermissions();
  const hasAccessToSupport = permissions(Permission.AccessSupportScreen);

  useEffect(() => {
    // Only initialize Featurebase if user has access to support screen
    if (!hasAccessToSupport) {
      return;
    }

    const win = window;

    // Initialize Featurebase if it doesn't exist
    if (typeof win.Featurebase !== 'function') {
      win.Featurebase = function (...args: unknown[]) {
        (win.Featurebase.q = win.Featurebase.q || []).push(args);
      };
    }

    // Only boot Featurebase if we have user data
    if (accountInfo?.userId) {
      // Fetch the userHash from the backend for identity verification
      api.users.getFeaturebaseIdentityHash().then((userHash) => {
        // Boot Featurebase messenger with configuration including user attributes
        win.Featurebase('boot', {
          appId: '6890e41acb9e844a4374a7a8', // required
          email: accountInfo.email,
          userId: accountInfo.userId,
          name: accountInfo.name,
          userHash: userHash, // Add the generated userHash for identity verification
          theme: 'light',
          language: 'en',
          companies: [
            {
              id: locationContext?.organizationId,
              name: organizationConfiguration?.organizationName,
              customFields: {
                locationId: locationContext?.locationId,
                locationName: locationConfiguration?.name,
              },
            },
          ],
        });
      });
    }
  }, [
    hasAccessToSupport,
    accountInfo,
    organizationConfiguration,
    locationConfiguration,
    locationContext,
  ]);

  useEffect(() => {
    // Only load the script if user has access to support screen
    if (!hasAccessToSupport) {
      return;
    }

    // Load the Featurebase SDK script (React equivalent of Next.js Script component)
    const existingScript = document.getElementById('featurebase-sdk');
    if (existingScript) {
      return; // Script already loaded
    }

    const script = document.createElement('script');
    script.src = 'https://do.featurebase.app/js/sdk.js';
    script.id = 'featurebase-sdk';
    script.async = true;

    document.head.appendChild(script);

    // Cleanup function
    return () => {
      const scriptElement = document.getElementById('featurebase-sdk');
      if (scriptElement) {
        scriptElement.remove();
      }
    };
  }, [hasAccessToSupport]);
};
