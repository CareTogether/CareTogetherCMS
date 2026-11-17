import assert from 'node:assert/strict';
import test from 'node:test';
import {
  legacySettingsTarget,
  isSettingsSectionActive,
  settingsSectionPath,
  settingsSections,
  getSettingsNavigationSections,
  CASE_POLICY_ADMINISTRATION_PATH,
  settingsCategories,
  settingsCategoryForSection,
  settingsCategoryPath,
  settingsCategoryBreadcrumb,
  isSettingsCategoryActive,
} from './settingsSections.ts';

test('category active states cover landing pages, section descendants and administration without crossing groups', () => {
  for (const path of [
    'tenant',
    'roles',
    'roles/Staff',
    'organization-categories',
  ]) {
    assert.equal(
      isSettingsCategoryActive('/org/org/a/settings/' + path, 'tenant'),
      true
    );
    assert.equal(
      isSettingsCategoryActive('/org/org/a/settings/' + path, 'location'),
      false
    );
  }
  for (const path of [
    'location-settings',
    'locations',
    'locations/other',
    ...settingsSections.map((section) => section.path),
    CASE_POLICY_ADMINISTRATION_PATH,
  ]) {
    assert.equal(
      isSettingsCategoryActive('/org/org/a/settings/' + path + '/', 'location'),
      true
    );
    assert.equal(
      isSettingsCategoryActive('/org/org/a/settings/' + path + '/', 'tenant'),
      false
    );
  }
  for (const category of settingsCategories)
    for (const path of [
      '/org/org/a/settings',
      '/org/org/a/clients',
      '/org/org/a/settings/roles-other',
    ])
      assert.equal(isSettingsCategoryActive(path, category.id), false);
});

const settingsVisibility = {
  canAccessSettings: true,
  policyEnabled: true,
  isOrganizationAdministrator: true,
  organizationCategoriesEnabled: true,
};

test('Settings categories preserve exact tenant and location membership and ordering', () => {
  const sections = getSettingsNavigationSections(settingsVisibility);
  assert.deepEqual(
    settingsCategories.map((category) => category.label),
    ['Tenant Settings', 'Location Settings']
  );
  assert.deepEqual(
    settingsCategories.map((category) =>
      sections
        .filter(
          (section) => settingsCategoryForSection(section.id).id === category.id
        )
        .map((section) => section.id)
    ),
    [
      ['roles', 'organizationCategories'],
      ['locations', ...settingsSections.map((section) => section.id)],
    ]
  );
  assert.equal(
    settingsCategoryPath('org', 'a', 'tenant'),
    '/org/org/a/settings/tenant'
  );
  assert.equal(
    settingsCategoryPath('org', 'b', 'location'),
    '/org/org/b/settings/location-settings'
  );
  assert.deepEqual(settingsCategoryBreadcrumb('org', 'b', 'casePolicy'), {
    label: 'Location Settings',
    to: '/org/org/b/settings/location-settings',
  });
  assert.deepEqual(settingsCategoryBreadcrumb('org', 'a', 'roles'), {
    label: 'Tenant Settings',
    to: '/org/org/a/settings/tenant',
  });
});

test('legacy administration bookmarks identify Case Policies during the compatibility redirect', () => {
  for (const trailing of ['', '/'])
    for (const section of settingsSections)
      assert.equal(
        isSettingsSectionActive(
          '/org/org/location/settings/' +
            CASE_POLICY_ADMINISTRATION_PATH +
            trailing,
          section.path
        ),
        section.id === 'casePolicy'
      );
});

test('shared Settings navigation puts administration first followed by every policy section', () => {
  const sections = getSettingsNavigationSections(settingsVisibility);
  assert.deepEqual(
    sections.map((section) => section.label),
    [
      'Roles',
      'Locations',
      'Organization Categories',
      'Action Definitions',
      'Custom Family Fields',
      'Case Policies',
      'Referral Policies',
      'Volunteer Policies',
      'Organization Approval Policies',
      'Access Levels',
    ]
  );
  assert.deepEqual(sections.slice(3), settingsSections);
  assert.deepEqual(
    sections.slice(0, 3).map((section) => section.path),
    ['roles', 'locations', 'organization-categories']
  );
  assert.equal(sections[1].cardLabel, 'Location');
});

test('Organization Categories requires both administrator access and its feature flag', () => {
  for (const isOrganizationAdministrator of [false, true])
    for (const organizationCategoriesEnabled of [false, true]) {
      const sections = getSettingsNavigationSections({
        ...settingsVisibility,
        isOrganizationAdministrator,
        organizationCategoriesEnabled,
      });
      assert.equal(
        sections.some((section) => section.id === 'organizationCategories'),
        isOrganizationAdministrator && organizationCategoriesEnabled
      );
      assert.deepEqual(
        sections.slice(0, 2).map((section) => section.id),
        ['roles', 'locations']
      );
      assert.deepEqual(
        sections.filter((section) =>
          settingsSections.some((policy) => policy.id === section.id)
        ),
        settingsSections
      );
    }
});

test('policy visibility preserves Access Levels and administration without self service', () => {
  assert.deepEqual(
    getSettingsNavigationSections({
      ...settingsVisibility,
      policyEnabled: false,
    }).map((section) => section.id),
    ['roles', 'locations', 'organizationCategories', 'accessLevels']
  );
  assert.deepEqual(
    getSettingsNavigationSections({
      ...settingsVisibility,
      canAccessSettings: false,
    }).map((section) => section.id),
    ['roles', 'locations', 'organizationCategories']
  );
});

test('all seven configuration routes have distinct paths and retain location scope', () => {
  assert.equal(settingsSections.length, 7);
  assert.equal(new Set(settingsSections.map((item) => item.path)).size, 7);
  for (const section of settingsSections) {
    assert.equal(
      settingsSectionPath('org', 'a', section.id),
      `/org/org/a/settings/${section.path}`
    );
    assert.equal(
      settingsSectionPath('org', 'b', section.id),
      `/org/org/b/settings/${section.path}`
    );
  }
});

test('Settings sidebar active states identify only the current section', () => {
  for (const selected of settingsSections)
    for (const item of settingsSections)
      for (const trailing of ['', '/'])
        assert.equal(
          isSettingsSectionActive(
            settingsSectionPath('org', 'a', selected.id) + trailing,
            item.path
          ),
          selected.id === item.id
        );
});

test('legacy tabs preserve the explicitly edited location and leave basic administration alone', () => {
  for (const section of settingsSections) {
    assert.equal(
      legacySettingsTarget('org', 'a', 'b', section.id),
      settingsSectionPath('org', 'b', section.id)
    );
    assert.equal(
      legacySettingsTarget('org', 'a', undefined, section.id),
      settingsSectionPath('org', 'a', section.id)
    );
  }
  for (const tab of [null, 'basic', 'unknown'])
    assert.equal(legacySettingsTarget('org', 'a', 'b', tab), undefined);
});
