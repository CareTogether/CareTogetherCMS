import type { RouteObject } from 'react-router-dom';

export type LocationSwitchPolicy = 'same-path' | 'dashboard';

export type LocationRoute = RouteObject & {
  locationSwitch: LocationSwitchPolicy;
  children?: LocationRoute[];
};
