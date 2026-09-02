import { useRequiredSelectedLocationContext } from '../Model/Data';
import { NavigateOptions, useNavigate } from 'react-router-dom';

export interface AppNavigate {
  dashboard: () => void;
  inbox: () => void;
  family: (
    familyId: string,
    v1CaseIdOrOptions?: string | FamilyNavigationOptions,
    arrangementId?: string,
    options?: { replace?: boolean }
  ) => void;
  community: (communityId: string) => void;
  settings: () => void;
  role: (roleId: string) => void;
  locationEdit: (locationId: string, options?: AppNavigateOptions) => void;
  settingsRoles: () => void;
  settingsLocations: () => void;
  referral: (referralId: string) => void;
}

type AppNavigateOptions = {
  replaceOrganizationId?: string;
  replaceLocationId?: string;
  navigateOptions?: NavigateOptions;
};

export type FamilyNavigationOptions = {
  v1CaseId?: string;
  arrangementId?: string;
  familyMemberId?: string;
  replace?: boolean;
};

/**
 * This hook provides a client-friendly set of shortcuts to enable strongly-typed navigation
 * to predefined application routes. It removes the burdesn of needing to load the selected
 * location context and maintaining path strings across the codebase.
 */
export function useAppNavigate(): AppNavigate {
  const navigate = useNavigate();
  const { organizationId, locationId } = useRequiredSelectedLocationContext();

  function inContext(pathSuffix: string, options?: AppNavigateOptions) {
    navigate(
      `/org/${options?.replaceOrganizationId || organizationId}/${options?.replaceLocationId || locationId}/${pathSuffix}`,
      options?.navigateOptions
    );
  }

  return {
    dashboard: () => inContext(''),
    inbox: () => inContext('inbox'),
    family: (
      familyId: string,
      v1CaseIdOrOptions?: string | FamilyNavigationOptions,
      arrangement?: string,
      options?: { replace?: boolean }
    ) => {
      const familyNavigationOptions =
        typeof v1CaseIdOrOptions === 'object'
          ? v1CaseIdOrOptions
          : {
              v1CaseId: v1CaseIdOrOptions,
              arrangementId: arrangement,
              replace: options?.replace,
            };
      const searchParams = new URLSearchParams();
      if (familyNavigationOptions.v1CaseId) {
        searchParams.append('v1CaseId', familyNavigationOptions.v1CaseId);
      }
      if (familyNavigationOptions.arrangementId) {
        searchParams.append(
          'arrangementId',
          familyNavigationOptions.arrangementId
        );
      }
      if (familyNavigationOptions.familyMemberId) {
        searchParams.append(
          'familyMemberId',
          familyNavigationOptions.familyMemberId
        );
      }
      const searchParamsString = searchParams.size
        ? `?${searchParams.toString()}`
        : '';
      return inContext(`families/${familyId}${searchParamsString}`, {
        navigateOptions: { replace: familyNavigationOptions.replace },
      });
    },

    community: (communityId: string) =>
      inContext(`communities/community/${communityId}`),
    settings: () => inContext(`settings`),
    role: (roleId: string) => inContext(`settings/roles/${roleId}`),
    locationEdit: (locationId: string, options?: AppNavigateOptions) =>
      inContext(`settings/locations/${locationId}`, options),
    settingsRoles: () => inContext('settings/roles'),
    settingsLocations: () => inContext('settings/locations'),
    referral: (referralId: string) => inContext(`referrals/${referralId}`),
  };
}
