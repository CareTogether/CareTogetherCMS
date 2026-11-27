import { useRequiredSelectedLocationContext } from '../Model/Data';
import { NavigateOptions, useNavigate } from 'react-router-dom';
import {
  appendApprovalTarget,
  arrangementRequirementQuery,
  type ApprovalNavigationTarget,
  type ArrangementRequirementTarget,
} from './workResolutionTarget';

export interface AppNavigate {
  dashboard: () => void;
  calendar: () => void;
  inbox: () => void;
  family: (
    familyId: string,
    v1CaseIdOrOptions?: string | FamilyNavigationOptions,
    arrangementId?: string,
    options?: { replace?: boolean }
  ) => void;
  organization: (
    organizationId: string,
    approval?: ApprovalNavigationTarget
  ) => void;
  settings: () => void;
  role: (roleId: string) => void;
  locationEdit: (locationId: string, options?: AppNavigateOptions) => void;
  settingsRoles: () => void;
  settingsLocations: () => void;
  settingsOrganizationCategories: () => void;
  referral: (referralId: string) => void;
}

type AppNavigateOptions = {
  replaceOrganizationId?: string;
  replaceLocationId?: string;
  navigateOptions?: NavigateOptions;
};

export type FamilyNavigationOptions = {
  section?: 'notes';
  v1CaseId?: string;
  arrangementId?: string;
  familyMemberId?: string;
  approval?: ApprovalNavigationTarget;
  arrangementRequirement?: ArrangementRequirementTarget;
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
    calendar: () => inContext('calendar'),
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
      if (familyNavigationOptions.section) {
        searchParams.set('section', familyNavigationOptions.section);
      }
      if (familyNavigationOptions.approval) {
        appendApprovalTarget(searchParams, familyNavigationOptions.approval);
      }
      if (
        familyNavigationOptions.arrangementId &&
        familyNavigationOptions.arrangementRequirement
      ) {
        searchParams.set(
          'arrangementRequirement',
          arrangementRequirementQuery(
            familyNavigationOptions.arrangementRequirement
          )
        );
      }
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

    organization: (
      organizationId: string,
      approval?: ApprovalNavigationTarget
    ) => {
      const params = new URLSearchParams();
      if (approval) appendApprovalTarget(params, approval);
      return inContext(
        `organizations/organization/${organizationId}${params.size ? `?${params}` : ''}`
      );
    },
    settings: () => inContext(`settings`),
    role: (roleId: string) => inContext(`settings/roles/${roleId}`),
    locationEdit: (locationId: string, options?: AppNavigateOptions) =>
      inContext(`settings/locations/${locationId}`, options),
    settingsRoles: () => inContext('settings/roles'),
    settingsLocations: () => inContext('settings/locations'),
    settingsOrganizationCategories: () =>
      inContext('settings/organization-categories'),
    referral: (referralId: string) => inContext(`referrals/${referralId}`),
  };
}
