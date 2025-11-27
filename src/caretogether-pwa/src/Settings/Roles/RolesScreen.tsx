import { ProgressBackdrop } from '../../Shell/ProgressBackdrop';
import { useScreenTitle } from '../../Shell/ShellScreenTitle';
import { useDataLoaded } from '../../Model/Data';
import { Box } from '@mui/system';
import { RolesSection } from './RolesSection';

export function RolesScreen() {
  useScreenTitle('Roles');

  const dataLoaded = useDataLoaded();
  return !dataLoaded ? (
    <ProgressBackdrop>
      <p className="ph-unmask">Loading roles...</p>
    </ProgressBackdrop>
  ) : (
    <Box className="ph-unmask" sx={{ paddingTop: 2 }}>
      <RolesSection />
    </Box>
  );
}
