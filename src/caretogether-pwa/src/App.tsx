import React from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import Header from './Components/Header';
import { Footer } from './Components/Footer';
import { HeaderContext } from './Components/HeaderContext';
import { AppRoutes } from './AppRoutes';
import { MainDrawer } from './Components/MainDrawer';

function App() {
  const [open, setOpen] = React.useState(false);
  const handleDrawerOpen = () => {
    setOpen(true);
  };
  const handleDrawerClose = () => {
    setOpen(false);
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const headerContainer = React.useRef(null);

  return (
    <div style={{display: 'flex'}}>
      <HeaderContext.Provider value={headerContainer}>
          <Header open={open} handleDrawerOpen={handleDrawerOpen} />
          {isMobile ? null :
            <MainDrawer open={open} handleDrawerClose={handleDrawerClose} />
          }
          <main style={{
            flexGrow: 1,
            height: isMobile ? `calc(100vh - 56px)` : '100vh', // subtract bottom navigation height on mobile
            overflow: 'auto'
          }}>
            <div style={{height: 48 /* Offset main content from page top by the header height amount */}} />
            <React.Suspense fallback={<div>Loading...</div>}>
              <AppRoutes />
            </React.Suspense>
          </main>
          {isMobile && <Footer></Footer>}
      </HeaderContext.Provider>
    </div>
  );
}

export default App;