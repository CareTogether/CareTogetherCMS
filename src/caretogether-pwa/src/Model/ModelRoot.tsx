import { useAccount, useMsal } from "@azure/msal-react";
import React from "react";
import { useState, useEffect } from "react";
import { atom, selector, useRecoilCallback, useRecoilState, useSetRecoilState } from "recoil";
import { authenticatingFetch } from "../Authentication/AuthenticatedHttp";
import { CombinedFamilyInfo, DirectoryClient, UserLocationAccess, UsersClient } from "../GeneratedClient";
import { useLocalStorage } from "../Hooks/useLocalStorage";
import { activeAccountState, currentOrganizationState, currentLocationState, currentPermissionsState, availableLocationsState } from "./SessionModel";

export const visibleFamiliesData = atom<CombinedFamilyInfo[]>({
  key: 'visibleFamiliesData',
  default: []
});

interface ModelLoaderProps {
  children?: React.ReactNode
}

export function ModelRoot({children}: ModelLoaderProps) {
  const activeAccount = useAccount();
  const setActiveAccountState = useSetRecoilState(activeAccountState);

  useEffect(() => {
    setActiveAccountState(activeAccount);
  }, [activeAccount, setActiveAccountState]);

  return (
    <>
      {children}
    </>
  );

  // const [organizationId, setOrganizationId] = useRecoilState(currentOrganizationState);
  // const [savedLocationId, setSavedLocationId] = useLocalStorage<string | null>('locationId', null);
  // const [locationId, ] = useRecoilState(currentLocationState);
  // const [, setCurrentPermissions] = useRecoilState(currentPermissionsState);
  // const [, setAvailableLocations] = useRecoilState(availableLocationsState)
  // const [loaded, setLoaded] = useState(false);
  
  // const setVisibleFamilies = useSetRecoilState(visibleFamiliesData);

  // const selectLocation = useRecoilCallback(({snapshot, set}) => (locations: UserLocationAccess[]) => {
  //   // Default to the most recently selected location, or the first available location
  //   // if none was previously saved or the saved location is no longer available.
  //   const selectedLocation =
  //     (savedLocationId == null || !locations.some(loc => loc.locationId === savedLocationId))
  //     ? locations[0]
  //     : locations.find(location => location.locationId === savedLocationId);
  //   setSavedLocationId(selectedLocation!.locationId!);
  //   set(currentLocationState, selectedLocation!.locationId!);
  //   setCurrentPermissions(selectedLocation!.permissions!);
  // }, []);

  // //TODO: Consider useRecoilSnapshot here instead
  // useEffect(() => {
  //   const loadInitialLocation = async () => {
  //     const usersClient = new UsersClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
  //     const userResponse = await usersClient.getUserOrganizationAccess();
  //     setOrganizationId(userResponse.organizationId!);
  //     setAvailableLocations(userResponse.locationIds!);
  //     selectLocation(userResponse.locationIds!);
  //   }
  //   loadInitialLocation();
  // }, [setOrganizationId, setAvailableLocations, selectLocation, setCurrentPermissions]);

  // useEffect(() => {
  //   const loadInitialData = async () => {
  //     if (organizationId.length > 0 && locationId.length > 0) {
  //       const directoryClient = new DirectoryClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
  //       const dataResponse = await directoryClient.listVisibleFamilies(organizationId, locationId);
  //       setVisibleFamilies(dataResponse);

  //       setLoaded(true);
  //     }
  //   }
  //   loadInitialData();
  // }, [organizationId, locationId, setVisibleFamilies]);
}
