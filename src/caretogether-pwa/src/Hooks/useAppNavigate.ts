import { useRecoilValue } from "recoil";
import { selectedLocationContextState } from "../Model/Data";
import { useNavigate } from "react-router-dom";

/**
 * This hook provides a client-friendly set of shortcuts to enable strongly-typed navigation
 * to predefined application routes. It removes the burdesn of needing to load the selected
 * location context and maintaining path strings across the codebase.
 */
export function useAppNavigate() {
  const navigate = useNavigate();
  const { organizationId, locationId } = useRecoilValue(selectedLocationContextState);

  function inContext(pathSuffix: string) {
    navigate(`/org/${organizationId}/${locationId}/${pathSuffix}`);
  }

  return {
    community: (communityId: string) => inContext(`communities/community/${communityId}`)
  };
}
