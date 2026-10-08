import assert from 'node:assert/strict';
import test from 'node:test';
import type { LocationRoute } from './LocationRoute.ts';
import { locationSwitchTarget } from './locationSwitchTarget.ts';

const currentBase = '/org/organization-1/location-1';
const nextBase = '/org/organization-1/location-2';
const routes: LocationRoute[] = [
  { index: true, element: null, locationSwitch: 'same-path' },
  {
    path: 'clients',
    element: null,
    locationSwitch: 'dashboard',
    children: [
      { index: true, element: null, locationSwitch: 'same-path' },
      {
        path: 'family/:familyId',
        element: null,
        locationSwitch: 'dashboard',
      },
    ],
  },
  {
    path: 'settings',
    element: null,
    locationSwitch: 'dashboard',
    children: [
      { path: 'roles', element: null, locationSwitch: 'same-path' },
      { path: 'locations', element: null, locationSwitch: 'same-path' },
      {
        path: 'locations/:editingLocationId',
        element: null,
        locationSwitch: 'same-path',
      },
    ],
  },
  { path: '*', element: null, locationSwitch: 'dashboard' },
];

function switchFrom(path: string, search = '', hash = '') {
  return locationSwitchTarget({
    routes,
    pathname: `${currentBase}${path}`,
    search,
    hash,
    organizationId: 'organization-1',
    currentLocationId: 'location-1',
    nextLocationId: 'location-2',
  });
}

test('keeps routes marked same-path and their URL state', () => {
  for (const path of [
    '/',
    '/clients',
    '/settings/roles',
    '/settings/locations',
  ]) {
    assert.equal(
      switchFrom(path, '?filter=open', '#results'),
      `${nextBase}${path}?filter=open#results`
    );
  }
});

test('keeps the explicit location editor ID on the same settings tab', () => {
  assert.equal(
    switchFrom('/settings/locations/location-1', '?tab=actionDefinitions'),
    `${nextBase}/settings/locations/location-1?tab=actionDefinitions`
  );
});

test('returns to the dashboard from routes marked dashboard', () => {
  for (const path of ['/clients/family/family-1', '/settings/not-a-page']) {
    assert.equal(switchFrom(path, '?familyMemberId=person-1'), `${nextBase}/`);
  }
});
