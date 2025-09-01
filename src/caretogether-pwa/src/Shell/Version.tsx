import { Typography, Box } from '@mui/material';
import { getAppVersion } from '../Utilities/appVersion';

export function Version() {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography
        variant="body2"
        color="#fff8"
        align="center"
        sx={{ lineHeight: '1.5em' }}
        className="ph-unmask"
      >
        Version: {getAppVersion()}
      </Typography>
    </Box>
  );
}
