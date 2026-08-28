import { useEffect, useState } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import { atom, useSetAtom } from 'jotai';
import { useAccountInfo } from '../Authentication/Auth';
import { useSelectedLocationContext } from '../Model/Data';
import {
  useLocationConfigurationLoadable,
  useOrganizationConfigurationLoadable,
} from '../Model/ConfigurationModel';
import { api } from '../Api/Api';
import { useGlobalPermissionsLoadable } from '../Model/SessionModel';
import { Permission } from '../GeneratedClient';

// Jotai atom for changelog unread count
export const changelogUnreadCountState = atom<number>(0);

const FEATUREBASE_DESKTOP_VERTICAL_PADDING = 20;
const FEATUREBASE_MOBILE_VERTICAL_PADDING = 70;

type FeaturebaseIdentity = {
  userHash: string;
  userId: string;
};

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Get user data from Jotai state
  const accountInfo = useAccountInfo();
  const organizationConfiguration = useOrganizationConfigurationLoadable();
  const locationConfiguration = useLocationConfigurationLoadable();
  const locationContext = useSelectedLocationContext();
  const setChangelogUnreadCount = useSetAtom(changelogUnreadCountState);
  const [featurebaseIdentity, setFeaturebaseIdentity] =
    useState<FeaturebaseIdentity>();

  // Check if user has permission to access support screen
  const permissions = useGlobalPermissionsLoadable();
  const hasAccessToSupport = permissions(Permission.AccessSupportScreen);

  useEffect(() => {
    if (!hasAccessToSupport || !accountInfo?.userId) {
      setFeaturebaseIdentity(undefined);
      return;
    }

    let cancelled = false;
    const userId = accountInfo.userId;

    void api.users.getFeaturebaseIdentityHash().then((userHash) => {
      if (cancelled) return;

      setFeaturebaseIdentity({ userHash, userId });
    });

    return () => {
      cancelled = true;
    };
  }, [accountInfo?.userId, hasAccessToSupport]);

  useEffect(() => {
    if (
      !hasAccessToSupport ||
      !accountInfo?.userId ||
      featurebaseIdentity?.userId !== accountInfo.userId
    ) {
      return;
    }

    const win = window;

    // Initialize Featurebase if it doesn't exist
    if (typeof win.Featurebase !== 'function') {
      win.Featurebase = function (...args: unknown[]) {
        (win.Featurebase.q = win.Featurebase.q || []).push(args);
      };
    }

    // Boot Featurebase messenger with configuration including user attributes
    win.Featurebase('boot', {
      appId: '6890e41acb9e844a4374a7a8', // required
      email: accountInfo.email,
      userId: accountInfo.userId,
      name: accountInfo.name,
      userHash: featurebaseIdentity.userHash,
      theme: 'light',
      language: 'en',
      verticalPadding: isMobile
        ? FEATUREBASE_MOBILE_VERTICAL_PADDING
        : FEATUREBASE_DESKTOP_VERTICAL_PADDING,
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

    // Initialize changelog widget after Featurebase is booted
    win.Featurebase(
      'init_changelog_widget',
      {
        organization: 'caretogether',
        theme: 'light',
        locale: 'en',
        dropdown: {
          enabled: true,
          placement: 'left',
        },
        popup: {
          enabled: false,
          autoOpenForNewUpdates: false,
        },
      },
      (
        error: unknown,
        data: { action?: string; unreadCount?: number } | null
      ) => {
        if (error) return;

        if (data?.action === 'unreadChangelogsCountChanged') {
          setChangelogUnreadCount(data.unreadCount ?? 0);
        }
      }
    );
  }, [
    hasAccessToSupport,
    accountInfo,
    featurebaseIdentity,
    organizationConfiguration,
    locationConfiguration,
    locationContext,
    isMobile,
    setChangelogUnreadCount,
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
