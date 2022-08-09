import { Stack, Typography } from '@mui/material';

export function ShellContextSwitcher() {
  const organization = "Organization";
  const location = "Location";

  return (
    <Stack sx={{ position: 'absolute' }}>
      <Typography variant='subtitle1' component="h1"
        sx={{ position: 'relative', top: -4, left: 8}}>
        {organization}
      </Typography>
      <Typography variant='subtitle2' component="h2"
        sx={{ position: 'relative', top: -8, left: 8}}>
        {location}
      </Typography>
    </Stack>
  );
}
