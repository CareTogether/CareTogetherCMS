import { useRecoilValue } from 'recoil';
import { selectedLocationContextState } from '../Model/Data';
import { useNavigate } from 'react-router-dom';

export interface AppNavigate {
  dashboard: () => void;
  inbox: () => void;
  family: (familyId: string) => void;
  community: (communityId: string) => void;
  settings: () => void;
  role: (roleId: string) => void;
}

/**
 * This hook provides a client-friendly set of shortcuts to enable strongly-typed navigation
 * to predefined application routes. It removes the burdesn of needing to load the selected
 * location context and maintaining path strings across the codebase.
 */
export function useAppNavigate(): AppNavigate {
  const navigate = useNavigate();
  const { organizationId, locationId } = useRecoilValue(
    selectedLocationContextState
  );

  function inContext(pathSuffix: string) {
    navigate(`/org/${organizationId}/${locationId}/${pathSuffix}`);
  }

  return {
    dashboard: () => inContext(''),
    inbox: () => inContext('inbox'),
    family: (familyId: string) => inContext(`families/${familyId}`),
    community: (communityId: string) =>
      inContext(`communities/community/${communityId}`),
    settings: () => inContext(`settings`),
    role: (roleId: string) => inContext(`settings/roles/${roleId}`),
  };
}
