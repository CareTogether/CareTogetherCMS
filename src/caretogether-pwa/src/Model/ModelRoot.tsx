import { useAccount } from "@azure/msal-react";
import { useEffect } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { useLoadable } from "../Hooks/useLoadable";
import { useScopedTrace } from "../Hooks/useScopedTrace";
import { visibleFamiliesData, visibleFamiliesInitializationQuery } from "./DirectoryModel";
import { userIdState, selectedLocationIdState, availableLocationsQuery } from "./SessionModel";

interface ModelLoaderProps {
  children?: React.ReactNode
}

export function ModelRoot({children}: ModelLoaderProps) {
  const trace = useScopedTrace("ModelRoot");
  trace("start");
  
  const activeAccount = useAccount();
  trace(`activeAccount: ${activeAccount?.localAccountId}`);
  const setUserId = useSetRecoilState(userIdState);
  const availableLocations = useLoadable(availableLocationsQuery);
  const [selectedLocationId, setSelectedLocationId] = useRecoilState(selectedLocationIdState);
  trace(`selectedLocationId: ${selectedLocationId.state} -- ${selectedLocationId.contents}`);
  const visibleFamilies = useLoadable(visibleFamiliesInitializationQuery);
  trace(`visibleFamilies.length: ${visibleFamilies?.length}`);
  const setVisibleFamiliesData = useSetRecoilState(visibleFamiliesData);
  
  // Initialize the root of the model's dataflow graph with the active account's user ID.
  // If the active account is changed, the model will automatically repopulate.
  useEffect(() => {
    const value = activeAccount?.localAccountId ?? null;
    trace(`setUserId: ${value}`);
    setUserId(value);
  }, [activeAccount, setUserId]);

  // Mark the correct location as the currently selected one.
  // This will be the most recently selected location, or the first available location
  // if none was previously saved or the saved location is no longer available.
  useEffect(() => {
    const selectedLocation =
      availableLocations == null
      ? null
      : (selectedLocationId == null || !availableLocations.some(loc => loc.locationId === selectedLocationId))  
        ? availableLocations[0]
        : availableLocations.find(loc => loc.locationId === selectedLocationId) || null;
    const locationIdToSelect = selectedLocation?.locationId || null;
    trace(`locationIdToSelect: ${locationIdToSelect}`);
    if (locationIdToSelect) {
      trace(`Setting selected location ID: ${locationIdToSelect}`);
      setSelectedLocationId(locationIdToSelect);
    }
  }, [availableLocations, selectedLocationId, setSelectedLocationId]);

  // Initialize the families atom that will be used to track family state mutations.
  //TODO: Trigger a refresh when changing locations.
  useEffect(() => {
    setVisibleFamiliesData(visibleFamilies || []);
  }, [visibleFamilies, setVisibleFamiliesData]);

  trace("render");
  return (
    <>
      {children}
    </>
  );
}
