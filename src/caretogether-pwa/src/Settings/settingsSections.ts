export const settingsSections = [
  {
    id: 'actionDefinitions',
    path: 'action-definitions',
    label: 'Action Definitions',
    description:
      'Configure activities, forms and their requirements for the selected location.',
  },
  {
    id: 'customFamilyFields',
    path: 'custom-family-fields',
    label: 'Custom Family Fields',
    description:
      'Configure additional family information for the selected location.',
  },
  {
    id: 'casePolicy',
    path: 'case-policies',
    label: 'Case Policies',
    description:
      'Configure arrangements, functions and requirements for the selected location.',
  },
  {
    id: 'v1ReferralPolicy',
    path: 'referral-policies',
    label: 'Referral Policies',
    description:
      'Configure referral intake and assignment requirements for the selected location.',
  },
  {
    id: 'volunteerPolicy',
    path: 'volunteer-policies',
    label: 'Volunteer Policies',
    description:
      'Configure volunteer roles and approvals for the selected location.',
  },
  {
    id: 'organizationPolicy',
    path: 'organization-approval-policies',
    label: 'Organization Approval Policies',
    description: 'Configure organization approvals for the selected location.',
  },
  {
    id: 'accessLevels',
    path: 'access-levels',
    label: 'Access Levels',
    description:
      'Review and configure access levels for the selected location.',
  },
] as const;
export type SettingsSection = (typeof settingsSections)[number]['id'];
export const CASE_POLICY_ADMINISTRATION_PATH = 'case-policies/administration';
export const settingsCategories = [
  {
    id: 'tenant',
    path: 'tenant',
    label: 'Tenant Settings',
    description: 'Manage tenant roles and organization categories.',
    sectionIds: ['roles', 'organizationCategories'],
  },
  {
    id: 'location',
    path: 'location-settings',
    label: 'Location Settings',
    description:
      'Configure administration and policies for the selected location.',
    sectionIds: ['locations', ...settingsSections.map((section) => section.id)],
  },
] as const;
export type SettingsCategory = (typeof settingsCategories)[number]['id'];

export function isSettingsCategoryActive(
  pathname: string,
  categoryId: SettingsCategory
) {
  const category = settingsCategories.find((item) => item.id === categoryId)!;
  const path = pathname.replace(/\/+$/, '').split('/settings/')[1];
  if (!path) return false;
  if (path === category.path) return true;
  const sectionPath = path.split('/')[0];
  const sectionId =
    settingsSections.find((section) => section.path === sectionPath)?.id ??
    (
      {
        roles: 'roles',
        locations: 'locations',
        'organization-categories': 'organizationCategories',
      } as Record<string, string>
    )[sectionPath];
  return category.sectionIds.some((id) => id === sectionId);
}

export function settingsCategoryForSection(sectionId: string) {
  return settingsCategories.find((category) =>
    category.sectionIds.some((id) => id === sectionId)
  )!;
}

export function settingsCategoryPath(
  organizationId: string,
  locationId: string,
  category: SettingsCategory
) {
  return `/org/${encodeURIComponent(organizationId)}/${encodeURIComponent(locationId)}/settings/${settingsCategories.find((item) => item.id === category)!.path}`;
}

export function settingsCategoryBreadcrumb(
  organizationId: string,
  locationId: string,
  sectionId: string
) {
  const category = settingsCategoryForSection(sectionId);
  return {
    label: category.label,
    to: settingsCategoryPath(organizationId, locationId, category.id),
  };
}
type SettingsNavigationSection = {
  id: SettingsSection | 'roles' | 'locations' | 'organizationCategories';
  path: string;
  label: string;
  cardLabel?: string;
  description: string;
};

export function getSettingsNavigationSections({
  canAccessSettings,
  policyEnabled,
  isOrganizationAdministrator,
  organizationCategoriesEnabled,
}: {
  canAccessSettings: boolean;
  policyEnabled: boolean;
  isOrganizationAdministrator: boolean;
  organizationCategoriesEnabled: boolean;
}): SettingsNavigationSection[] {
  return [
    {
      id: 'roles',
      path: 'roles',
      label: 'Roles',
      description:
        'Configure role definitions for your Staff, Volunteers, and others. Define what each role is able to view and edit.',
    },
    {
      id: 'locations',
      path: 'locations',
      label: 'Locations',
      cardLabel: 'Location',
      description: 'Configure basic administration for the selected location.',
    },
    ...(isOrganizationAdministrator && organizationCategoriesEnabled
      ? [
          {
            id: 'organizationCategories' as const,
            path: 'organization-categories',
            label: 'Organization Categories',
            description:
              'Define the categories available for classifying Organizations across your Tenant.',
          },
        ]
      : []),
    ...(canAccessSettings
      ? settingsSections.filter(
          (section) => section.id === 'accessLevels' || policyEnabled
        )
      : []),
  ];
}

export function isSettingsSectionActive(pathname: string, path: string) {
  const normalized = pathname.replace(/\/+$/, '');
  return (
    normalized.endsWith('/settings/' + path) ||
    (path === 'case-policies' &&
      normalized.endsWith('/settings/' + CASE_POLICY_ADMINISTRATION_PATH))
  );
}
export function settingsSectionPath(
  organizationId: string,
  locationId: string,
  section: SettingsSection
) {
  return (
    '/org/' +
    encodeURIComponent(organizationId) +
    '/' +
    encodeURIComponent(locationId) +
    '/settings/' +
    settingsSections.find((item) => item.id === section)!.path
  );
}
export function legacySettingsTarget(
  organizationId: string,
  locationId: string,
  editingLocationId: string | undefined,
  tab: string | null
) {
  const section = settingsSections.find((item) => item.id === tab);
  return section
    ? settingsSectionPath(
        organizationId,
        editingLocationId ?? locationId,
        section.id
      )
    : undefined;
}
