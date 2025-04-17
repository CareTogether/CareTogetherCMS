import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import useScreenTitle from '../Shell/ShellScreenTitle';
import { useDataLoaded } from '../Model/Data';
import { Box } from '@mui/system';
import { RolesSection } from './Roles/RolesSection';
import { LocationsSection } from './Roles/LocationsSection';

export function SettingsScreen() {
  useScreenTitle('Settings');

  const dataLoaded = useDataLoaded();
  return !dataLoaded ? (
    <ProgressBackdrop>
      <p>Loading settings...</p>
    </ProgressBackdrop>
  ) : (
    <Box sx={{ paddingTop: 2 }}>
      <RolesSection />
      <LocationsSection />
    </Box>
  );
}
