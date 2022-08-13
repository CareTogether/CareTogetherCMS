import { Skeleton } from "@mui/material";
import { userOrganizationAccessQuery } from "./Model/SessionModel";
import { useLoadable } from "./Hooks/useLoadable";

export function UiTest() {
  // const [organizationId, setOrganizationId] = useRecoilState(currentOrganizationState);
  // const [savedLocationId, setSavedLocationId] = useLocalStorage<string | null>('locationId', null);
  // const [locationId, ] = useRecoilState(currentLocationState);
  // const [, setCurrentPermissions] = useRecoilState(currentPermissionsState);
  // const [, setAvailableLocations] = useRecoilState(availableLocationsState);
  // const [loaded, setLoaded] = useState(false);

  const data = useLoadable(userOrganizationAccessQuery);
  
  console.log("Rendering... data = " + JSON.stringify(data).substring(0, 100));
  return (
    <>
      <p>UI Test</p>
      {data !== null
        ? <pre>{JSON.stringify(data)}</pre>
        : <Skeleton variant="rectangular" width={400} height={24} />}
    </>
  );
}