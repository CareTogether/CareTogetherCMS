import { useState, useEffect } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { authenticatingFetch } from "../Auth";
import { VolunteerFamiliesClient } from "../GeneratedClient";
import { currentOrganizationState, currentLocationState } from "./SessionModel";
import { volunteerFamiliesData } from "./VolunteerFamiliesModel";

interface ModelLoaderProps {
  children?: React.ReactNode
}

export function ModelLoader({children}: ModelLoaderProps) {
  const organizationId = useRecoilValue(currentOrganizationState);
  const locationId = useRecoilValue(currentLocationState);
  const [loaded, setLoaded] = useState(false);

  const setVolunteerFamilies = useSetRecoilState(volunteerFamiliesData);

  //TODO: Consider useRecoilSnapshot here instead
  useEffect(() => {
    const loadInitialData = async () => {
      const volunteerFamiliesClient = new VolunteerFamiliesClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
      const dataResponse = await volunteerFamiliesClient.listAllVolunteerFamilies(organizationId, locationId);
      setVolunteerFamilies(dataResponse);

      setLoaded(true);
    }
    loadInitialData();
  }, [organizationId, locationId, setVolunteerFamilies]);

  return loaded
    ? <>{children}</>
    : <p>Loading model...</p>;
}
