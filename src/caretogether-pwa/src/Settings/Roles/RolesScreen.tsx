import { useScreenTitle } from '../../Shell/ShellScreenTitle';
import { Box } from '@mui/system';
import { RolesSection } from './RolesSection';

export function RolesScreen() {
  useScreenTitle('Roles');

  return (
    <Box className="ph-unmask" sx={{ paddingTop: 2 }}>
      <RolesSection />
    </Box>
  );
}
