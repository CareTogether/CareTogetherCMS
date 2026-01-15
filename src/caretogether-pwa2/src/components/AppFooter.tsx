import { Box, Stack, Typography } from '@mui/material';
import { Favorite as FavoriteIcon } from '@mui/icons-material';

export function AppFooter() {
  return (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
        <FavoriteIcon sx={{ color: 'primary.dark', fontSize: 24 }} />
        <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'primary.dark' }}>
          4,300 partnering families supported through your dedication.
        </Typography>
      </Stack>
    </Box>
  );
}
