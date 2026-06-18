import { Chip, Box } from '@mui/material';
import { FamilyScreen } from './FamilyScreen';

export function FamilyScreenV2() {
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1, pt: 1 }}>
        <Chip color="secondary" size="small" label="BETA V2" />
      </Box>
      <FamilyScreen />
    </>
  );
}
