import { useScreenTitle } from '../../Shell/ShellScreenTitle';
import { Box } from '@mui/system';
import { LocationsSection } from './LocationsSection';

export function LocationsScreen() {
  useScreenTitle('Locations');

  return (
    <Box className="ph-unmask" sx={{ paddingTop: 2 }}>
      <LocationsSection />
    </Box>
  );
}
