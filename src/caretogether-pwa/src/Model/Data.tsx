import { useCallback } from 'react';
import { atom, useAtomValue, useSetAtom, useStore } from 'jotai';
import { atomFamily } from 'jotai-family';
import { api } from '../Api/Api';
import { accountInfoState } from '../Authentication/Auth';
import type { LocationScope } from './LocationScope';
import { isSameLocationScope } from './LocationScope';
import {
  createRecordsScopeCache,
  type VisibleAggregatesAction,
} from './recordsScopeCache';
import {
  mergeRecordsCommandResult,
  runAtomicRecordsCommand,
} from './recordsCommandUpdates';
import { useJotaiLoadable } from '../State/jotai/useJotaiLoadable';
import {
  createRefreshAtom,
  createRefreshTokenAtom,
} from '../State/jotai/refreshAtom';
import {
  AtomicRecordsCommand,
  CommunityRecordsAggregate,
  CompositeRecordsCommand,
  FamilyRecordsAggregate,
  RecordsAggregate,
  ReferralRecordsAggregate,
} from '../GeneratedClient';

const userOrganizationAccessRefreshToken = createRefreshTokenAtom();

// This will be available to query (asynchronously) after the authenticated route tree is rendered.
const userOrganizationAccessAtom = atom(async (get) => {
  get(userOrganizationAccessRefreshToken);
  await get(accountInfoState);
  const userResponse = await api.users.getUserOrganizationAccess();
  return userResponse;
});

const refreshUserOrganizationAccessAtom = createRefreshAtom(
  userOrganizationAccessRefreshToken
);

export type LocationContext = LocationScope;

// This will be set by the AppRoutes organization & location selection logic (i.e., the value depends on the URL).
export const selectedLocationContextState = atom<LocationContext | null>(null);

// This will be available to query after the selectedLocationContextState is set by AppRoutes.
const currentOrganizationAtom = atom(async (get) => {
  const userOrganizationAccess = await get(userOrganizationAccessAtom);
  const selectedLocationContext = get(selectedLocationContextState);

  if (!selectedLocationContext) {
    return null;
  }

  const selectedOrganization = userOrganizationAccess.organizations?.find(
    (org) =>
      org.organizationId &&
      org.organizationId === selectedLocationContext.organizationId
  );

  if (!selectedOrganization) {
    const availableOrganizations = userOrganizationAccess?.organizations?.map(
      (org) => org.organizationId
    );
    throw new Error(
      `The organization selection (ID '${selectedLocationContext.organizationId}' is invalid.\n` +
        `Available organizations are: ${availableOrganizations?.join(', ')}`
    );
  }
  return selectedOrganization;
});

// This will be available to query after the selectedLocationIdState is set by AppRoutes.
const currentLocationAtom = atom(async (get) => {
  const currentOrganization = await get(currentOrganizationAtom);
  const selectedLocationContext = get(selectedLocationContextState);

  if (!selectedLocationContext) {
    return null;
  }

  const selectedLocation = currentOrganization?.locations?.find(
    (loc) =>
      loc.locationId && loc.locationId === selectedLocationContext.locationId
  );

  if (!selectedLocation) {
    const availableLocations = currentOrganization?.locations?.map(
      (loc) => loc.locationId
    );
    throw new Error(
      `The location selection (ID '${selectedLocationContext.locationId}' is invalid.\n` +
        `Available locations are: ${availableLocations?.join(', ')}`
    );
  }
  return selectedLocation;
});

// The collection of visible records (aggregates) is scoped to the current organization and location.
// When the records for the current location are loaded, this will be populated with those records.
// Subsequently, this will be imperatively managed by the Model codebase as browser-local state.
// The client can write a refresh action to force a refresh of a particular scope's visible records.
export const visibleAggregatesForScopeData = atomFamily(
  (scope: LocationContext) =>
    createRecordsScopeCache(() =>
      api.records.listVisibleAggregates(scope.organizationId, scope.locationId)
    ),
  isSameLocationScope
);

const noVisibleAggregates = atom<RecordsAggregate[]>([]);

// For convenience, only the currently visible records are exported to the client from this module.
export const visibleAggregatesState = atom(
  (get) => {
    const context = get(selectedLocationContextState);
    return get(
      context ? visibleAggregatesForScopeData(context) : noVisibleAggregates
    );
  },
  async (get, set, newValue: VisibleAggregatesAction) => {
    const context = get(selectedLocationContextState);
    if (!context) {
      return;
    }
    await set(visibleAggregatesForScopeData(context), newValue);
  }
);

export function useAtomicRecordsCommandCallback<
  T extends unknown[],
  U extends AtomicRecordsCommand,
>(callback: (aggregateId: string, ...args: T) => Promise<U>) {
  const context = useRequiredSelectedLocationContext();
  const store = useStore();

  return useCallback(
    async (aggregateId: string, ...args: T) => {
      const command = await callback(aggregateId, ...args);
      await runAtomicRecordsCommand(
        api.records,
        context,
        aggregateId,
        command,
        (scope, update) =>
          store.set(visibleAggregatesForScopeData(scope), update)
      );
    },
    [callback, context, store]
  );
}

export function useCompositeRecordsCommandCallback<T extends unknown[]>(
  callback: (
    aggregateId: string,
    ...args: T
  ) => Promise<CompositeRecordsCommand>
) {
  const context = useRequiredSelectedLocationContext();
  const store = useStore();

  return useCallback(
    async (aggregateId: string, ...args: T) => {
      const { organizationId, locationId } = context;
      const command = await callback(aggregateId, ...args);

      const updatedAggregates = await api.records.submitCompositeRecordsCommand(
        organizationId,
        locationId,
        command
      );

      await store.set(visibleAggregatesForScopeData(context), (current) =>
        mergeRecordsCommandResult(current, aggregateId, updatedAggregates)
      );
    },
    [callback, context, store]
  );
}

export function useSelectedLocationContext() {
  return useAtomValue(selectedLocationContextState);
}

export function useRequiredSelectedLocationContext() {
  const selectedLocationContext = useSelectedLocationContext();

  if (selectedLocationContext === null) {
    throw new Error('Selected location context has not been initialized.');
  }

  return selectedLocationContext;
}

export function useSetSelectedLocationContext() {
  return useSetAtom(selectedLocationContextState);
}

export function useUserOrganizationAccessLoadable() {
  return useJotaiLoadable(userOrganizationAccessAtom);
}

export function useRefreshUserOrganizationAccess() {
  return useSetAtom(refreshUserOrganizationAccessAtom);
}

export function useCurrentOrganizationLoadable() {
  return useJotaiLoadable(currentOrganizationAtom);
}

export function useCurrentLocation() {
  return useAtomValue(currentLocationAtom);
}

export function useCurrentLocationLoadable() {
  return useJotaiLoadable(currentLocationAtom);
}

export function useVisibleFamilies() {
  return useAtomValue(visibleFamiliesAtom);
}

export function useVisibleCommunities() {
  return useAtomValue(visibleCommunitiesAtom);
}

export function useVisibleReferrals() {
  return useAtomValue(visibleReferralsAtom);
}

export function useVisibleReferralsLoadable() {
  return useJotaiLoadable(visibleReferralsAtom);
}

export function mapLoadedValue<T, U>(
  value: T | Promise<T>,
  mapValue: (value: T) => U
) {
  return value instanceof Promise ? value.then(mapValue) : mapValue(value);
}

function mapVisibleAggregates<T>(
  visibleAggregates: RecordsAggregate[] | Promise<RecordsAggregate[]>,
  mapAggregates: (visibleAggregates: RecordsAggregate[]) => T
) {
  return mapLoadedValue(visibleAggregates, mapAggregates);
}
export const visibleFamiliesAtom = atom((get) => {
  const visibleAggregates = get(visibleAggregatesState);
  return mapVisibleAggregates(visibleAggregates, (aggregates) =>
    aggregates
      .filter((aggregate) => aggregate instanceof FamilyRecordsAggregate)
      .map((aggregate) => (aggregate as FamilyRecordsAggregate).family!)
  );
});

export const visibleCommunitiesAtom = atom((get) => {
  const visibleAggregates = get(visibleAggregatesState);
  return mapVisibleAggregates(visibleAggregates, (aggregates) =>
    aggregates
      .filter((aggregate) => aggregate instanceof CommunityRecordsAggregate)
      .map((aggregate) => (aggregate as CommunityRecordsAggregate).community!)
  );
});

const visibleReferralsAtom = atom((get) => {
  const visibleAggregates = get(visibleAggregatesState);
  return mapVisibleAggregates(visibleAggregates, (aggregates) =>
    aggregates
      .filter((aggregate) => aggregate instanceof ReferralRecordsAggregate)
      .map((aggregate) => (aggregate as ReferralRecordsAggregate).referral)
  );
});
