import { Typography } from '@mui/material';
import { getAppVersion } from '../Utilities/appVersion';

export function Version() {
  return (
    <Typography
      variant="body2"
      color="#fff8"
      align="center"
      sx={{ lineHeight: '1.5em' }}
      className="ph-unmask"
    >
      Version: {getAppVersion()}
    </Typography>
  );
}
