import { Typography, Box } from '@mui/material';
import { getAppVersion } from '../Utilities/appVersion';

export function Version() {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography
        variant="caption"
        color="#fff6"
        align="center"
        sx={{ lineHeight: '1.5em', fontSize: '0.7rem' }}
        className="ph-unmask"
      >
        Version: {getAppVersion()}
      </Typography>
    </Box>
  );
}