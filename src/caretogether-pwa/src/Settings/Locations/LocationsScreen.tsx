import { ProgressBackdrop } from '../../Shell/ProgressBackdrop';
import { useScreenTitle } from '../../Shell/ShellScreenTitle';
import { useDataLoaded } from '../../Model/Data';
import { Box } from '@mui/system';
import { LocationsSection } from './LocationsSection';

export function LocationsScreen() {
  useScreenTitle('Locations');

  const dataLoaded = useDataLoaded();
  return !dataLoaded ? (
    <ProgressBackdrop>
      <p className="ph-unmask">Loading locations...</p>
    </ProgressBackdrop>
  ) : (
    <Box className="ph-unmask" sx={{ paddingTop: 2 }}>
      <LocationsSection />
    </Box>
  );
}
