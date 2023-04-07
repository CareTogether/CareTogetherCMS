import { atom, atomFamily, selector, selectorFamily } from "recoil";
import { useLoadable } from "../Hooks/useLoadable";
import { api } from "../Api/Api";
import { CommunityRecordsAggregate, FamilyRecordsAggregate, RecordsAggregate } from "../GeneratedClient";

// This will be set by AuthenticationWrapper once the user has authenticated and the default account is set.
export const userIdState = atom<string>({
  key: 'userIdState'
});

// This will be available to query (asynchronously) after the userIdState is set (i.e., post-authentication).
export const userOrganizationAccessQuery = selector({
  key: 'userOrganizationAccessQuery',
  get: async ({get}) => {
    const userId = get(userIdState);
    console.log(`Reevaluating userOrganizationAccessQuery for user ID: ${userId}`);
    const userResponse = await api.users.getUserOrganizationAccess();
    return userResponse;
  }
});

// This will be set by the AppRoutes organization selection logic (i.e., the value depends on the URL).
export const selectedOrganizationIdState = atom<string>({
  key: 'selectedOrganizationIdState'
});

// This will be available to query after the selectedOrganizationIdForUserIdState is set by AppRoutes.
export const currentOrganizationQuery = selector({
  key: 'currentOrganizationQuery',
  get: ({get}) => {
    const userOrganizationAccess = get(userOrganizationAccessQuery);
    const selectedOrganizationId = get(selectedOrganizationIdState);
    console.log(`Reevaluating currentOrganizationQuery for organization ID: ${selectedOrganizationId}`);

    const selectedOrganization = userOrganizationAccess.organizations?.find(org =>
      org.organizationId && org.organizationId === selectedOrganizationId);

    if (!selectedOrganization) {
      const availableOrganizations = userOrganizationAccess?.organizations?.map(org => org.organizationId);
      throw new Error(`The organization selection (ID '${selectedOrganizationId}' is invalid.\n` +
        `Available organizations are: ${availableOrganizations?.join(", ")}`);
    }
    return selectedOrganization;
  }
});

// This will be set by the AppRoutes organization selection logic (i.e., the value depends on the URL).
export const selectedLocationIdState = atom<string>({
  key: 'selectedLocationIdState'
});

// This will be available to query after the selectedLocationIdState is set by AppRoutes.
export const currentLocationQuery = selector({
  key: 'currentLocationQuery',
  get: ({get}) => {
    const currentOrganization = get(currentOrganizationQuery);
    const selectedLocationId = get(selectedLocationIdState);
    console.log(`Reevaluating currentLocationQuery for organization ID ${currentOrganization.organizationId} and location ID: ${selectedLocationId}`);

    const selectedLocation = currentOrganization?.locations?.find(loc =>
      loc.locationId && loc.locationId === selectedLocationId);

    if (!selectedLocation) {
      const availableLocations = currentOrganization?.locations?.map(loc => loc.locationId);
      throw new Error(`The location selection (ID '${selectedLocationId}' is invalid.\n` +
        `Available locations are: ${availableLocations?.join(", ")}`);
    }
    return selectedLocation;
  }
});

export type CurrentDataScope = {
  organizationId: string;
  locationId: string;
}

// The collection of visible records (aggregates) is scoped to the current organization and location.
// When the records for the current location are loaded, this will be populated with those records.
// Subsequently, this will be imperatively managed by the Model codebase as browser-local state.
// The client can call useResetRecoilState to force a refresh of a particular scope's visible records.
const visibleAggregatesForScopeData = atomFamily<RecordsAggregate[], CurrentDataScope>({
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
  get: ({get}) => visibleAggregatesForScopeData({
    organizationId: get(selectedOrganizationIdState),
    locationId: get(selectedLocationIdState)
  }),
  set: ({get, set}, newValue) => set(visibleAggregatesForScopeData({
    organizationId: get(selectedOrganizationIdState),
    locationId: get(selectedLocationIdState)
  }), newValue)
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
