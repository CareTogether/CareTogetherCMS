import { Outlet } from 'react-router-dom';
import { useSessionStorage } from '../Hooks/useSessionStorage';

export type VolunteersRouteContext =
  | {
      version: 'v1';
      lastScreen: 'approval' | 'progress';
      setLastScreen: (screen: 'approval' | 'progress') => void;
    }
  | { version: 'v2' };

export function Volunteers() {
  const [lastScreen, setLastScreen] = useSessionStorage<
    'approval' | 'progress'
  >('volunteer-lastScreen', 'approval');

  return <Outlet context={{ version: 'v1', lastScreen, setLastScreen }} />;
}
