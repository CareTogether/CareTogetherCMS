import { useAccount } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { useRecoilCallback, useRecoilState, useSetRecoilState } from "recoil";
import { authenticatingFetch } from "../Authentication/AuthenticatedHttp";
import { UserLocationAccess, UsersClient, DirectoryClient } from "../GeneratedClient";
import { useLocalStorage } from "../Hooks/useLocalStorage";
import { visibleFamiliesData } from "./DirectoryModel";
import { userIdState, availableLocationsState, currentLocationState, currentOrganizationState, currentPermissionsState } from "./SessionModel";

interface ModelLoaderProps {
  children?: React.ReactNode
}

export function ModelRoot({children}: ModelLoaderProps) {
  const activeAccount = useAccount();
  const [userId, setUserId] = useRecoilState(userIdState);
  
  const [savedLocationId, setSavedLocationId] = useLocalStorage<string | null>('locationId', null);
  const [locationId, ] = useRecoilState(currentLocationState);
  const [, setCurrentPermissions] = useRecoilState(currentPermissionsState);
  const setVisibleFamilies = useSetRecoilState(visibleFamiliesData);

  useEffect(() => {
    setUserId(activeAccount?.localAccountId ?? null);
  }, [activeAccount, userId, setUserId]);

  const selectLocation = useRecoilCallback(({snapshot, set}) => (locations: UserLocationAccess[]) => {
    // Default to the most recently selected location, or the first available location
    // if none was previously saved or the saved location is no longer available.
    const selectedLocation =
      (savedLocationId == null || !locations.some(loc => loc.locationId === savedLocationId))
      ? locations[0]
      : locations.find(location => location.locationId === savedLocationId);
    setSavedLocationId(selectedLocation!.locationId!);
    set(currentLocationState, selectedLocation!.locationId!);
    setCurrentPermissions(selectedLocation!.permissions!);
  }, []);

  // selectLocation(userResponse.locationIds!);
  
  useEffect(() => {
    const loadInitialData = async () => {
      if (userId && organizationId.length > 0 && locationId.length > 0) {
        console.log("Loading initial data...")
        const directoryClient = new DirectoryClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
        const dataResponse = await directoryClient.listVisibleFamilies(organizationId, locationId);
        setVisibleFamilies(dataResponse);

        //setLoaded(true);
      }
    }
    loadInitialData();
  }, [userId, organizationId, locationId, setVisibleFamilies]);

  return (
    <>
      {children}
    </>
  );
}
