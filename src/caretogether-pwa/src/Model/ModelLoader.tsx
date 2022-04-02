import { useState, useEffect } from "react";
import { atom, useRecoilState, useSetRecoilState } from "recoil";
import { authenticatingFetch } from "../Auth";
import { CombinedFamilyInfo, DirectoryClient, UsersClient } from "../GeneratedClient";
import { useLocalStorage } from "../useLocalStorage";
import { currentOrganizationState, currentLocationState, currentPermissionsState, availableLocationsState } from "./SessionModel";

export const visibleFamiliesData = atom<CombinedFamilyInfo[]>({
  key: 'visibleFamiliesData',
  default: []
});

interface ModelLoaderProps {
  children?: React.ReactNode
}

export function ModelLoader({children}: ModelLoaderProps) {
  const [organizationId, setOrganizationId] = useRecoilState(currentOrganizationState);
  const [savedLocationId, setSavedLocationId] = useLocalStorage<string | null>('locationId', null);
  const [locationId, setLocationId] = useRecoilState(currentLocationState);
  const [, setCurrentPermissions] = useRecoilState(currentPermissionsState);
  const [, setAvailableLocations] = useRecoilState(availableLocationsState)
  const [loaded, setLoaded] = useState(false);
  
  const setVisibleFamilies = useSetRecoilState(visibleFamiliesData);

  //TODO: Consider useRecoilSnapshot here instead
  useEffect(() => {
    console.log("effecting 1...");
    const loadInitialLocation = async () => {
      const usersClient = new UsersClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
      const userResponse = await usersClient.getUserOrganizationAccess();
      setOrganizationId(userResponse.organizationId!);
      setAvailableLocations(userResponse.locationIds!);

      // Default to the most recently selected location, or the first available location
      // if none was previously saved or the saved location is no longer available.
      const selectedLocationId =
        (savedLocationId == null || !userResponse.locationIds!.some(loc => loc.locationId === savedLocationId))
        ? userResponse.locationIds![0].locationId!
        : savedLocationId;
      setSavedLocationId(selectedLocationId);
      setLocationId(userResponse.locationIds![0].locationId!);
      setCurrentPermissions(userResponse.locationIds![0].permissions!);
    }
    console.log("run 1...");
    loadInitialLocation();
    console.log("effected 1");
  }, [setOrganizationId, setLocationId, setCurrentPermissions]);

  useEffect(() => {
    console.log("effecting 2...");
    const loadInitialData = async () => {
      if (organizationId.length > 0 && locationId.length > 0) {
        const directoryClient = new DirectoryClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
        const dataResponse = await directoryClient.listVisibleFamilies(organizationId, locationId);
        setVisibleFamilies(dataResponse);

        setLoaded(true);
      }
    }
    console.log("run 2...");
    loadInitialData();
    console.log("effected 2");
  }, [organizationId, locationId, setVisibleFamilies]);

  return loaded
    ? <>{children}</>
    : <p>Loading model...</p>;
}
