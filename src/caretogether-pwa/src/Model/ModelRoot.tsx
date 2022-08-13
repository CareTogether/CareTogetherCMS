import { useAccount } from "@azure/msal-react";
import { useEffect } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { useLoadable } from "../Hooks/useLoadable";
import { useLocalStorage } from "../Hooks/useLocalStorage";
import { userIdState, selectedLocationIdState, availableLocationsQuery } from "./SessionModel";

interface ModelLoaderProps {
  children?: React.ReactNode
}

export function ModelRoot({children}: ModelLoaderProps) {
  const activeAccount = useAccount();
  const [userId, setUserId] = useRecoilState(userIdState);
  const availableLocations = useLoadable(availableLocationsQuery);
  const [savedLocationId, setSavedLocationId] = useLocalStorage<string | null>('locationId', null);
  const setSelectedLocationId = useSetRecoilState(selectedLocationIdState);
  
  // Initialize the root of the model's dataflow graph with the active account's user ID.
  // If the active account is changed, the model will automatically repopulate.
  useEffect(() => {
    setUserId(activeAccount?.localAccountId ?? null);
  }, [activeAccount, userId, setUserId]);

  // Mark the correct location as the currently selected one.
  // This will be the most recently selected location, or the first available location
  // if none was previously saved or the saved location is no longer available.
  useEffect(() => {
    const selectedLocation =
      availableLocations == null
      ? null
      : (savedLocationId == null || !availableLocations.some(loc => loc.locationId === savedLocationId))  
        ? availableLocations[0]
        : availableLocations.find(loc => loc.locationId === savedLocationId) || null;
    setSavedLocationId(selectedLocation?.locationId || null);
    setSelectedLocationId(selectedLocation?.locationId || null);
  }, [availableLocations, savedLocationId, setSavedLocationId, setSelectedLocationId]);

  return (
    <>
      {children}
    </>
  );
}
