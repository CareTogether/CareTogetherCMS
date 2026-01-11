import { useState } from 'react';
import { ThemeProvider } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { Button, Container, Typography, Box } from '@mui/material';
import { theme, Shell, ContextHeader } from '@caretogether/ui-components';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/700.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Shell>
        <Shell.Header />
        <Shell.Sidebar></Shell.Sidebar>
        <Shell.Content>
          <ContextHeader>
            <ContextHeader.Breadcrumbs
              items={[{ label: 'Home', onClick: () => navigate('/') }, { label: 'Current Page' }]}
            />
            <ContextHeader.Title title="Page Title"></ContextHeader.Title>
          </ContextHeader>
          {/* Your content here */}
          <Container maxWidth="md">
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h2" component="h1" gutterBottom>
                CareTogether PWA
              </Typography>
              <Typography variant="h5" color="text.secondary" paragraph>
                Built with Vite 7, React 19, TypeScript, and MUI 7
              </Typography>
              <Box sx={{ mt: 4 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => setCount(count => count + 1)}
                >
                  Count is {count}
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
                Edit src/App.tsx and save to test HMR
              </Typography>
            </Box>
          </Container>
        </Shell.Content>
      </Shell>
    </ThemeProvider>
  );
}

export default App;
