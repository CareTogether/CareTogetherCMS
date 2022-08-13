import { Skeleton } from "@mui/material";
import { RecoilValue, useRecoilValueLoadable } from "recoil";
import { userOrganizationAccessQuery } from "./Model/SessionModel";

function useModel<T>(value: RecoilValue<T | null>) {
  const loadableValue = useRecoilValueLoadable(value);
  if (loadableValue.state === 'hasValue' && loadableValue.contents !== null) {
    return loadableValue.contents;
  } else if (loadableValue.state === 'hasError') {
    throw loadableValue.contents;
  } else {
    return null;
  }
}

export function UiTest() {
  // const [organizationId, setOrganizationId] = useRecoilState(currentOrganizationState);
  // const [savedLocationId, setSavedLocationId] = useLocalStorage<string | null>('locationId', null);
  // const [locationId, ] = useRecoilState(currentLocationState);
  // const [, setCurrentPermissions] = useRecoilState(currentPermissionsState);
  // const [, setAvailableLocations] = useRecoilState(availableLocationsState);
  // const [loaded, setLoaded] = useState(false);

  const data = useModel(userOrganizationAccessQuery);
  
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