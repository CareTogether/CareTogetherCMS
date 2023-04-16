import { atom, atomFamily, selector, selectorFamily } from "recoil";
import { useLoadable } from "../Hooks/useLoadable";
import { api } from "../Api/Api";
import { CommunityRecordsAggregate, FamilyRecordsAggregate, RecordsAggregate } from "../GeneratedClient";
import { loggingEffect } from "../Utilities/loggingEffect";

// This will be set by AuthenticationWrapper once the user has authenticated and the default account is set.
export const userIdState = atom<string>({
  key: 'userIdState',
  effects: [
    loggingEffect
  ]
});

// This will be available to query (asynchronously) after the userIdState is set (i.e., post-authentication).
export const userOrganizationAccessQuery = selector({
  key: 'userOrganizationAccessQuery',
  get: async ({get}) => {
    //HACK: Requiring the user ID state to be set is a workaround for fall-through issues with the AuthenticationWrapper
    //      and AuthenticatedUserWrapper. Removing this currently would cause runtime errors regarding the MsalProvider
    //      being updated while a child component is being rendered (e.g., the ShellContextSwitcher).
    get(userIdState);
    const userResponse = await api.users.getUserOrganizationAccess();
    return userResponse;
  }
});

export type LocationContext = {
  organizationId: string,
  locationId: string
};

// This will be set by the AppRoutes organization & location selection logic (i.e., the value depends on the URL).
export const selectedLocationContextState = atom<LocationContext>({
  key: 'selectedLocationContextState',
  effects: [
    loggingEffect
  ]
});

export const selectedOrganizationIdState = selector({
  key: 'selectedOrganizationIdState__DEPRECATED',
  get: ({get}) => {
    const { organizationId } = get(selectedLocationContextState);
    return organizationId;
  }
});

export const selectedLocationIdState = selector({
  key: 'selectedLocationIdState__DEPRECATED',
  get: ({get}) => {
    const { locationId } = get(selectedLocationContextState);
    return locationId;
  }
});

// This will be available to query after the selectedLocationContextState is set by AppRoutes.
export const currentOrganizationQuery = selector({
  key: 'currentOrganizationQuery',
  get: ({get}) => {
    const userOrganizationAccess = get(userOrganizationAccessQuery);
    const selectedLocationContext = get(selectedLocationContextState);

    const selectedOrganization = userOrganizationAccess.organizations?.find(org =>
      org.organizationId && org.organizationId === selectedLocationContext.organizationId);

    if (!selectedOrganization) {
      const availableOrganizations = userOrganizationAccess?.organizations?.map(org => org.organizationId);
      throw new Error(`The organization selection (ID '${selectedLocationContext.organizationId}' is invalid.\n` +
        `Available organizations are: ${availableOrganizations?.join(", ")}`);
    }
    return selectedOrganization;
  }
});

// This will be available to query after the selectedLocationIdState is set by AppRoutes.
export const currentLocationQuery = selector({
  key: 'currentLocationQuery',
  get: ({get}) => {
    const currentOrganization = get(currentOrganizationQuery);
    const selectedLocationContext = get(selectedLocationContextState);

    const selectedLocation = currentOrganization?.locations?.find(loc =>
      loc.locationId && loc.locationId === selectedLocationContext.locationId);

    if (!selectedLocation) {
      const availableLocations = currentOrganization?.locations?.map(loc => loc.locationId);
      throw new Error(`The location selection (ID '${selectedLocationContext.locationId}' is invalid.\n` +
        `Available locations are: ${availableLocations?.join(", ")}`);
    }
    return selectedLocation;
  }
});

// The collection of visible records (aggregates) is scoped to the current organization and location.
// When the records for the current location are loaded, this will be populated with those records.
// Subsequently, this will be imperatively managed by the Model codebase as browser-local state.
// The client can call useResetRecoilState to force a refresh of a particular scope's visible records.
const visibleAggregatesForScopeData = atomFamily<RecordsAggregate[], LocationContext>({
  key: 'visibleAggregatesForScopeData',
  default: selectorFamily({
    key: 'visibleAggregatesForScopeData/default',
    get: scope => async () => {
      const visibleAggregates = await api.records.listVisibleAggregates(scope.organizationId, scope.locationId);
      return visibleAggregates;
    }
  })
});

// For convenience, only the currently visible records are exported to the client from this module.
export const visibleAggregatesState = selector({
  key: 'visibleAggregatesState',
  get: ({get}) => {
    const context = get(selectedLocationContextState);
    const visibleAggregates = visibleAggregatesForScopeData(context);
    const results = get(visibleAggregates);
    return results;
  },
  set: ({get, set}, newValue) => {
    const context = get(selectedLocationContextState);
    set(visibleAggregatesForScopeData(context), newValue);
  }
})

// This hook can be used for convenience to determine if the current scope's records have been loaded.
export function useDataLoaded() {
  return useLoadable(visibleAggregatesState) != null;
}

export const visibleFamiliesQuery = selector({
  key: 'visibleFamiliesQuery',
  get: ({get}) => {
    const visibleAggregates = get(visibleAggregatesState);
    return visibleAggregates.filter(aggregate => aggregate instanceof FamilyRecordsAggregate).map(aggregate =>
      (aggregate as FamilyRecordsAggregate).family!);
  }
});

export const visibleCommunitiesQuery = selector({
  key: 'visibleCommunitiesQuery',
  get: ({get}) => {
    const visibleAggregates = get(visibleAggregatesState);
    return visibleAggregates.filter(aggregate => aggregate instanceof CommunityRecordsAggregate).map(aggregate =>
      (aggregate as CommunityRecordsAggregate).community!);
  }
});
