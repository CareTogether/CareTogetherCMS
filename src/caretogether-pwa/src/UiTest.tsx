import { Skeleton } from "@mui/material";
import { useEffect } from "react";
import { atom, selector, useRecoilValueLoadable, useSetRecoilState } from "recoil";
import { authenticatingFetch } from "./Authentication/AuthenticatedHttp";
import { UsersClient } from "./GeneratedClient";

const initializeUiState = atom<null | true>({
  key: 'initializeUiState',
  default: null
});

async function load() {
  const usersClient = new UsersClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
  const userResponse = await usersClient.getUserOrganizationAccess();
  return userResponse;
}

const userOrganizationAccessQuery = selector({
  key: 'userOrganizationAccessQuery',
  get: async ({get}) => {
    const initializeUi = get(initializeUiState);
    console.log("userOrganizationAccessQuery - initializeUi: " + JSON.stringify(initializeUi));
    if (initializeUi) {
      const response = await load();
      return response;
    } else {
      return null;
    }
  }
});

export function UiTest() {
  // const [organizationId, setOrganizationId] = useRecoilState(currentOrganizationState);
  // const [savedLocationId, setSavedLocationId] = useLocalStorage<string | null>('locationId', null);
  // const [locationId, ] = useRecoilState(currentLocationState);
  // const [, setCurrentPermissions] = useRecoilState(currentPermissionsState);
  // const [, setAvailableLocations] = useRecoilState(availableLocationsState);
  // const [loaded, setLoaded] = useState(false);

  const setInitializeUi = useSetRecoilState(initializeUiState);
  const data = useRecoilValueLoadable(userOrganizationAccessQuery);
  
  useEffect(() => {
    console.log("Setting initializeUi to true...");
    setInitializeUi(true);
  }, [setInitializeUi]);

  console.log("Rendering... data = " + JSON.stringify(data).substring(0, 100));
  return (
    <>
      <p>UI Test</p>
      {data.state === 'loading'
        ? <Skeleton variant="rectangular" width={400} height={24} />
        : data.state === 'hasError'
        ? <p><strong>ERROR: <pre>{JSON.stringify(data.contents)}</pre></strong></p>
        : <pre>{JSON.stringify(data.contents)}</pre>}
    </>
  );
}