import { Skeleton } from "@mui/material";
import { useRecoilValueLoadable } from "recoil";
import { userOrganizationAccessQuery } from "./Model/SessionModel";

export function UiTest() {
  // const [organizationId, setOrganizationId] = useRecoilState(currentOrganizationState);
  // const [savedLocationId, setSavedLocationId] = useLocalStorage<string | null>('locationId', null);
  // const [locationId, ] = useRecoilState(currentLocationState);
  // const [, setCurrentPermissions] = useRecoilState(currentPermissionsState);
  // const [, setAvailableLocations] = useRecoilState(availableLocationsState);
  // const [loaded, setLoaded] = useState(false);

  const data = useRecoilValueLoadable(userOrganizationAccessQuery);
  
  console.log("Rendering... data = " + JSON.stringify(data).substring(0, 100));
  return (
    <>
      <p>UI Test</p>
      {data.state === 'hasValue' && data.contents !== null
        ? <pre>{JSON.stringify(data.contents)}</pre>
        : <Skeleton variant="rectangular" width={400} height={24} />}
        {/* // : data.state === 'hasError'
        // ? <p><strong>ERROR: <pre>{JSON.stringify(data.contents)}</pre></strong></p> */}
    </>
  );
}