import { Typography, Box } from '@mui/material';
import { getAppVersion } from '../Utilities/appVersion';

export function Copyright() {
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
      <Typography
        variant="body2"
        color="#fff8"
        align="center"
        sx={{ lineHeight: '2em' }}
      >
        {' © '} {new Date().getFullYear()} &nbsp;
        <a
          style={{ color: '#fff8', textDecoration: 'none' }}
          href="https://caretogether.io/"
          target="_blank"
          rel="noreferrer"
        >
          CareTogether CMS
        </a>
        <br />
      </Typography>
    </Box>
  );
}
