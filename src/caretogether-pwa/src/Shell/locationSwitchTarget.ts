import { matchRoutes } from 'react-router-dom';
import type { LocationRoute } from './LocationRoute';

type LocationSwitchTargetOptions = {
  routes: LocationRoute[];
  pathname: string;
  search: string;
  hash: string;
  organizationId: string;
  currentLocationId: string;
  nextLocationId: string;
};

export function locationSwitchTarget({
  routes,
  pathname,
  search,
  hash,
  organizationId,
  currentLocationId,
  nextLocationId,
}: LocationSwitchTargetOptions): string {
  const currentBase = `/org/${organizationId}/${currentLocationId}`;
  const nextBase = `/org/${organizationId}/${nextLocationId}`;
  const suffix = pathname.startsWith(`${currentBase}/`)
    ? pathname.slice(currentBase.length + 1).replace(/\/+$/, '')
    : '';

  const matches = matchRoutes(routes, `/${suffix}`);
  if (matches?.at(-1)?.route.locationSwitch === 'same-path') {
    return `${nextBase}/${suffix}${search}${hash}`;
  }

  return `${nextBase}/`;
}
