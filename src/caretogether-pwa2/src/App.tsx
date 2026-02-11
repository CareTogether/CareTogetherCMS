import { useState } from 'react';
import { ThemeProvider } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { theme, Shell } from '@caretogether/ui-components';
import { AppHeader } from './components/AppHeader';
import { AppSidebar } from './components/AppSidebar';
import { AppFooter } from './components/AppFooter';
import { Index } from './pages/Index';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/700.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('atlantis');
  const [searchValue, setSearchValue] = useState('');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Shell
        sidebarOpen={sidebarOpen}
        header={
          <AppHeader
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            selectedLocation={selectedLocation}
            onLocationChange={setSelectedLocation}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
          />
        }
        sidebar={
          <Shell.Sidebar>
            <AppSidebar collapsed={!sidebarOpen} />
          </Shell.Sidebar>
        }
        content={
          <Shell.Content>
            <Index />
          </Shell.Content>
        }
        footer={
          <Shell.Footer>
            <AppFooter />
          </Shell.Footer>
        }
      />
    </ThemeProvider>
  );
}

export default App;
