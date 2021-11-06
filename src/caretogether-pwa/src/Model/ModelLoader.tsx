import { useState, useEffect } from "react";
import { atom, useRecoilState, useSetRecoilState } from "recoil";
import { authenticatingFetch } from "../Auth";
import { CombinedFamilyInfo, DirectoryClient, UsersClient } from "../GeneratedClient";
import { currentOrganizationState, currentLocationState } from "./SessionModel";

export const visibleFamiliesData = atom<CombinedFamilyInfo[]>({
  key: 'visibleFamiliesData',
  default: []
});

interface ModelLoaderProps {
  children?: React.ReactNode
}

export function ModelLoader({children}: ModelLoaderProps) {
  const [organizationId, setOrganizationId] = useRecoilState(currentOrganizationState);
  const [locationId, setLocationId] = useRecoilState(currentLocationState);
  const [loaded, setLoaded] = useState(false);
  
  const setVisibleFamilies = useSetRecoilState(visibleFamiliesData);

  //TODO: Consider useRecoilSnapshot here instead
  useEffect(() => {
    const loadInitialLocation = async () => {
      const usersClient = new UsersClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
      const userResponse = await usersClient.getUserTenantAccess();
      setOrganizationId(userResponse.organizationId!);
      setLocationId(userResponse.locationIds![0]);
    }
    loadInitialLocation();
  }, [setOrganizationId, setLocationId]);

  useEffect(() => {
    const loadInitialData = async () => {
      if (organizationId.length > 0 && locationId.length > 0) {
        const directoryClient = new DirectoryClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
        const dataResponse = await directoryClient.listVisibleFamilies(organizationId, locationId);
        setVisibleFamilies(dataResponse);

        setLoaded(true);
      }
    }
    loadInitialData();
  }, [organizationId, locationId, setVisibleFamilies]);

  return loaded
    ? <>{children}</>
    : <p>Loading model...</p>;
}
