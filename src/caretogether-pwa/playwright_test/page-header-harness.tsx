import { createRoot } from 'react-dom/client';
import { Box, Button, CssBaseline, Stack, ThemeProvider } from '@mui/material';
import { theme } from '../src/theme';
import { ResponsivePageHeader } from '../src/Generic/ResponsivePageHeader';

const withActions = new URLSearchParams(location.search).has('actions');
createRoot(document.getElementById('root')!).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <Box sx={{ px: { xs: 2, sm: 3 } }}>
      <Stack spacing={{ xs: 1, sm: 2 }}>
        <ResponsivePageHeader
          title="Clients"
          description="Review families."
          actions={
            withActions ? (
              <Button size="small" variant="contained">
                Add family
              </Button>
            ) : undefined
          }
        />
        <Box data-testid="content">Content</Box>
      </Stack>
    </Box>
  </ThemeProvider>
);
