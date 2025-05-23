import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import useScreenTitle from '../Shell/ShellScreenTitle';
import { useDataLoaded } from '../Model/Data';
import { Box } from '@mui/system';
import { LocationsSection } from './Roles/LocationsSection';

export function LocationsScreen() {
  useScreenTitle('Locations');

  const dataLoaded = useDataLoaded();
  return !dataLoaded ? (
    <ProgressBackdrop>
      <p>Loading locations...</p>
    </ProgressBackdrop>
  ) : (
    <Box sx={{ paddingTop: 2 }}>
      <LocationsSection />
    </Box>
  );
}
