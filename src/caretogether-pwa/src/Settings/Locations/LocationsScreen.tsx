import { useEffect } from 'react';
import { useAppNavigate } from '../../Hooks/useAppNavigate';
import { useRequiredSelectedLocationContext } from '../../Model/Data';
import { ProgressBackdrop } from '../../Shell/ProgressBackdrop';

export function LocationsScreen() {
  const { locationId } = useRequiredSelectedLocationContext();
  const appNavigate = useAppNavigate();

  useEffect(() => {
    appNavigate.locationEdit(locationId, {
      navigateOptions: { replace: true },
    });
  }, [appNavigate, locationId]);

  return (
    <ProgressBackdrop opaque>
      <p className="ph-unmask">Opening location configuration...</p>
    </ProgressBackdrop>
  );
}
