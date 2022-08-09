import { useState } from 'react';
import { Box, Container, useMediaQuery, useTheme } from '@mui/material';
import { ShellBottomNavigation } from './ShellBottomNavigation';
import { ShellAppBar } from './ShellAppBar';
import { ShellSideNavigation } from './ShellSideNavigation';

interface ShellRootLayoutProps {
  children?: React.ReactNode
}
function ShellRootLayout({ children }: ShellRootLayoutProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [menuDrawerOpen, setMenuDrawerOpen] = useState(isDesktop);

  const drawerWidth = menuDrawerOpen ? 180 : 48;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <ShellAppBar menuDrawerOpen={menuDrawerOpen} setMenuDrawerOpen={setMenuDrawerOpen}
        drawerWidth={drawerWidth + 'px'} />
      {isDesktop && <ShellSideNavigation open={menuDrawerOpen} width={drawerWidth} />}
      <Box sx={{ flexGrow: 1, marginLeft: isDesktop ? drawerWidth + 'px' : null }}>
        <Container maxWidth={false} sx={{
            marginTop: { xs: 7, sm: 8, md: 6 },
            marginBottom: isDesktop ? 0 : 7
          }}>
          {children}
        </Container>
      </Box>
      {!isDesktop && <ShellBottomNavigation />}
    </Box>
  );
}

export default ShellRootLayout;
