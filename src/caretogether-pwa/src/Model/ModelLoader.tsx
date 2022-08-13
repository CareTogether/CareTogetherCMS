import React from "react";
import { useState, useEffect } from "react";
import { atom, selector, useRecoilCallback, useRecoilState, useSetRecoilState } from "recoil";
import { authenticatingFetch } from "../Authentication/AuthenticatedHttp";
import { CombinedFamilyInfo, DirectoryClient, UserLocationAccess, UsersClient } from "../GeneratedClient";
import { useLocalStorage } from "../Hooks/useLocalStorage";
import { currentOrganizationState, currentLocationState, currentPermissionsState, availableLocationsState, initializeModelRootState } from "./SessionModel";

class ModelErrorBoundary extends React.Component<{ children?: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: {}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // You can also log the error to an error reporting service
    console.log("error");
    console.log(error);
    console.log("errorInfo");
    console.log(errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <>
          <h1>Something went wrong.</h1>
          <pre>{JSON.stringify(this.state.error)}</pre>
        </>
      );
    }

    return this.props.children; 
  }
}

export const visibleFamiliesData = atom<CombinedFamilyInfo[]>({
  key: 'visibleFamiliesData',
  default: []
});

interface ModelLoaderProps {
  children?: React.ReactNode
}

export function ModelLoader({children}: ModelLoaderProps) {
  const setInitializeModelRoot = useSetRecoilState(initializeModelRootState);

  useEffect(() => {
    console.log("Setting initializeUiRootState to true...");
    setInitializeModelRoot(true);
  }, [setInitializeModelRoot]);

  return (
    <>
      <ModelErrorBoundary>
        {children}
      </ModelErrorBoundary>
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

  // return loaded
  //   ? <React.Suspense fallback={<p>Still loading, please wait...</p>}>
  //       {children}
  //     </React.Suspense>
  //   : <p>Loading model...</p>;
}
