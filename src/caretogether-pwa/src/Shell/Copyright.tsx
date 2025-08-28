import { Typography, Box } from '@mui/material';

export function Copyright() {
  return (
    <Box sx={{ textAlign: 'center' }}>
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
