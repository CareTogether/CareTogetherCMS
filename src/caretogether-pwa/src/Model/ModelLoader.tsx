import { useState, useEffect } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { authenticatingFetch } from "../Auth";
import { DirectoryClient, UsersClient, VolunteersClient } from "../GeneratedClient";
import { currentOrganizationState, currentLocationState } from "./SessionModel";
import { volunteerFamiliesData } from "./VolunteersModel";

interface ModelLoaderProps {
  children?: React.ReactNode
}

export function ModelLoader({children}: ModelLoaderProps) {
  const [organizationId, setOrganizationId] = useRecoilState(currentOrganizationState);
  const [locationId, setLocationId] = useRecoilState(currentLocationState);
  const [loaded, setLoaded] = useState(false);
  
  const setVolunteerFamilies = useSetRecoilState(volunteerFamiliesData);

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
        setVolunteerFamilies(dataResponse.filter(f => f.volunteerFamilyInfo)); //TODO: Make this part a selector

        setLoaded(true);
      }
    }
    loadInitialData();
  }, [organizationId, locationId, setVolunteerFamilies]);

  return loaded
    ? <>{children}</>
    : <p>Loading model...</p>;
}
