import type { Meta, StoryObj } from "@storybook/react-vite";
import { Shell } from "./Shell";
import {
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Container,
  Button,
  Drawer,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useTheme,
  useMediaQuery,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircle from "@mui/icons-material/AccountCircle";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import HomeIcon from "@mui/icons-material/Home";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { useState } from "react";

const meta: Meta<typeof Shell> = {
  title: "Components/Layout/Shell",
  component: Shell,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof Shell>;

/**
 * Basic shell layout with all components composed together.
 * The Shell component automatically arranges the header full-width at top,
 * sidebar and content side-by-side below (using CSS Grid), and footer full-width at bottom.
 */
export const Complete: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <Shell sidebarOpen={open}>
        <Shell.Header
          leftContent={
            <>
              <IconButton onClick={() => setOpen(!open)} edge="start" sx={{ mr: 2 }}>
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" noWrap>
                CareTogether CMS
              </Typography>
            </>
          }
          rightContent={
            <IconButton>
              <AccountCircle />
            </IconButton>
          }
        />

        <Shell.Sidebar open={open}>
          <List>
            <ListItem disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <PeopleIcon />
                </ListItemIcon>
                <ListItemText primary="Families" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </ListItemButton>
            </ListItem>
          </List>
        </Shell.Sidebar>

        <Shell.Content>
          <Container sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
              Welcome to CareTogether
            </Typography>
            <Typography variant="body1" paragraph>
              This is an example of the Shell compound component pattern. The header, sidebar,
              content area, and footer are all composable parts that you can customize.
            </Typography>
            <Button variant="contained" color="primaryDark" sx={{ mb: 4 }}>
              Get Started
            </Button>

            <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
              Scrollable Content
            </Typography>
            <Typography variant="body1" paragraph>
              Scroll down to see how the shell handles longer content. The header stays at the top,
              the sidebar remains fixed on the left, and the content area is scrollable.
            </Typography>

            {Array.from({ length: 40 }, (_, i) => (
              <Box key={i} sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Section {i + 1}
                </Typography>
                <Typography variant="body2" paragraph>
                  This is placeholder content to demonstrate scrolling behavior. The Shell component
                  provides a flexible layout system that adapts to different content heights. Notice
                  how the sidebar and header remain in their positions as you scroll through the
                  content.
                </Typography>
              </Box>
            ))}

            <Typography variant="h5" gutterBottom>
              End of Content
            </Typography>
            <Typography variant="body1" paragraph>
              You&apos;ve reached the bottom! The footer should be visible below this content.
            </Typography>
          </Container>
        </Shell.Content>

        <Shell.Footer>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" color="text.secondary">
              © 2025 CareTogether
            </Typography>
            <Typography variant="caption" color="text.secondary">
              v1.0.0
            </Typography>
          </Box>
        </Shell.Footer>
      </Shell>
    );
  },
};

/**
 * Minimal shell with just header and content.
 */
export const MinimalLayout: Story = {
  render: () => (
    <Shell>
      <Shell.Header centerContent={<Typography variant="h6">Simple App</Typography>} />

      <Shell.Content>
        <Container sx={{ py: 4 }}>
          <Typography variant="h4">Minimal Layout</Typography>
          <Typography variant="body1">
            This example shows a minimal shell with just a header and content area.
          </Typography>
        </Container>
      </Shell.Content>
    </Shell>
  ),
};

/**
 * Header with left, center, and right content areas.
 */
export const HeaderOnly: Story = {
  render: () => (
    <Shell.Header
      leftContent={
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6">My App</Typography>
        </Box>
      }
      centerContent={<Typography variant="body1">Dashboard</Typography>}
      rightContent={
        <>
          <Button>Login</Button>
          <IconButton>
            <AccountCircle />
          </IconButton>
        </>
      }
    />
  ),
  decorators: [
    (Story) => (
      <Box sx={{ minHeight: "64px", bgcolor: "background.default" }}>
        <Story />
      </Box>
    ),
  ],
};

/**
 * Sidebar component in isolation showing open and closed states.
 */
export const SidebarOnly: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <Box sx={{ display: "flex", height: "100vh" }}>
        <Shell.Sidebar open={open}>
          <Box sx={{ p: 2 }}>
            <Button fullWidth variant="outlined" onClick={() => setOpen(!open)}>
              {open ? "Close" : "Open"}
            </Button>
          </Box>
          <List>
            <ListItem disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <PeopleIcon />
                </ListItemIcon>
                <ListItemText primary="Users" />
              </ListItemButton>
            </ListItem>
          </List>
        </Shell.Sidebar>

        <Box sx={{ flexGrow: 1, p: 3 }}>
          <Typography variant="h5">Main Content Area</Typography>
          <Typography variant="body1">
            The sidebar is {open ? "expanded (236px)" : "collapsed (88px)"}.
          </Typography>
        </Box>
      </Box>
    );
  },
};

/**
 * Footer component in isolation.
 */
export const FooterOnly: Story = {
  render: () => (
    <Shell.Footer>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body2" color="text.secondary">
          © 2025 CareTogether. All rights reserved.
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Privacy Policy
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Terms of Service
          </Typography>
          <Typography variant="caption" color="text.secondary">
            v1.2.3
          </Typography>
        </Box>
      </Box>
    </Shell.Footer>
  ),
};

/**
 * Fixed header with scrollable content.
 */
export const FixedHeader: Story = {
  render: () => (
    <Shell>
      <Shell.Header
        position="fixed"
        leftContent={<Typography variant="h6">Fixed Layout</Typography>}
      />

      <Shell.Content>
        <Container sx={{ py: 4 }}>
          {Array.from({ length: 50 }, (_, i) => (
            <Typography key={i} paragraph>
              Content line {i + 1}. Scroll to see the fixed header and footer in action.
            </Typography>
          ))}
        </Container>
      </Shell.Content>

      <Shell.Footer>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Footer stays at bottom
        </Typography>
      </Shell.Footer>
    </Shell>
  ),
};

/**
 * Mobile-responsive navigation pattern demonstrating how to handle mobile menus.
 * The sidebar is hidden below 'md' breakpoint, and consumers implement their own
 * mobile navigation solution (temporary drawer + optional bottom navigation).
 *
 * **Pattern Overview:**
 * - Desktop (≥ 900px): Persistent sidebar with toggle button
 * - Mobile (< 900px): Sidebar hidden, hamburger menu opens temporary drawer
 * - Optional: Bottom navigation for primary actions on mobile
 *
 * Resize the browser window or use Storybook's viewport toolbar to see responsive behavior.
 */
export const MobileNavigation: Story = {
  render: () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [bottomNavValue, setBottomNavValue] = useState(0);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const navigationItems = [
      { icon: <DashboardIcon />, label: "Dashboard" },
      { icon: <PeopleIcon />, label: "Families" },
      { icon: <AssignmentIcon />, label: "Referrals" },
      { icon: <SettingsIcon />, label: "Settings" },
    ];

    return (
      <>
        <Shell sidebarOpen={sidebarOpen} hideSidebarBelow="md">
          <Shell.Header
            leftContent={
              <>
                <IconButton
                  onClick={() =>
                    isMobile ? setMobileMenuOpen(true) : setSidebarOpen(!sidebarOpen)
                  }
                  edge="start"
                  sx={{ mr: 2 }}
                  aria-label={isMobile ? "open menu" : "toggle sidebar"}
                >
                  <MenuIcon />
                </IconButton>
                <Typography variant="h6" noWrap>
                  CareTogether
                </Typography>
              </>
            }
            rightContent={
              <IconButton aria-label="account">
                <AccountCircle />
              </IconButton>
            }
          />

          <Shell.Sidebar>
            <List>
              {navigationItems.map((item, index) => (
                <ListItem key={index} disablePadding>
                  <ListItemButton selected={index === 0}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Shell.Sidebar>

          <Shell.Content>
            <Container sx={{ py: 4, pb: isMobile ? 10 : 4 }}>
              <Typography variant="h4" gutterBottom>
                Responsive Navigation Example
              </Typography>

              <Paper sx={{ p: 3, mb: 3, bgcolor: "info.light", color: "info.contrastText" }}>
                <Typography variant="h6" gutterBottom>
                  Current View: {isMobile ? "Mobile" : "Desktop"}
                </Typography>
                <Typography variant="body2">
                  {isMobile
                    ? "📱 Sidebar hidden. Using hamburger menu + bottom navigation."
                    : "🖥️ Sidebar visible. Toggle with menu button."}
                </Typography>
              </Paper>

              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                Implementation Notes
              </Typography>
              <Typography variant="body1" paragraph>
                This pattern demonstrates the recommended approach for responsive navigation:
              </Typography>
              <Box component="ul" sx={{ pl: 3 }}>
                <li>
                  <Typography variant="body2" paragraph>
                    <strong>Shell Component:</strong> Set{" "}
                    <code>hideSidebarBelow=&quot;md&quot;</code> to automatically hide the sidebar
                    on mobile screens.
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" paragraph>
                    <strong>Header Button:</strong> Conditionally render hamburger (mobile) vs
                    sidebar toggle (desktop) using <code>useMediaQuery</code>.
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" paragraph>
                    <strong>Mobile Menu:</strong> Implement your own MUI Drawer for mobile
                    navigation with application-specific menu items and logic.
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" paragraph>
                    <strong>Bottom Navigation (Optional):</strong> Add BottomNavigation for quick
                    access to primary actions on mobile.
                  </Typography>
                </li>
              </Box>

              <Divider sx={{ my: 4 }} />

              <Typography variant="h5" gutterBottom>
                Scrollable Content
              </Typography>
              {Array.from({ length: 20 }, (_, i) => (
                <Typography key={i} variant="body2" paragraph>
                  Content section {i + 1}. Scroll to see how the layout adapts. On mobile, notice
                  the bottom navigation stays fixed at the bottom of the viewport.
                </Typography>
              ))}
            </Container>
          </Shell.Content>

          <Shell.Footer>
            <Typography variant="body2" color="text.secondary">
              © 2025 CareTogether
            </Typography>
          </Shell.Footer>
        </Shell>

        {/* Mobile Drawer Menu - Consumer's responsibility */}
        <Drawer
          anchor="left"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          sx={{
            "& .MuiDrawer-paper": {
              width: 280,
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Menu
            </Typography>
          </Box>
          <Divider />
          <List>
            {navigationItems.map((item, index) => (
              <ListItem key={index} disablePadding>
                <ListItemButton selected={index === 0} onClick={() => setMobileMenuOpen(false)}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <AccountCircle />
                </ListItemIcon>
                <ListItemText primary="Profile" />
              </ListItemButton>
            </ListItem>
          </List>
        </Drawer>

        {/* Bottom Navigation - Optional for mobile */}
        {isMobile && (
          <Paper
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: (theme) => theme.zIndex.appBar,
            }}
            elevation={3}
          >
            <BottomNavigation
              value={bottomNavValue}
              onChange={(_, newValue) => setBottomNavValue(newValue)}
              showLabels
            >
              <BottomNavigationAction label="Home" icon={<HomeIcon />} />
              <BottomNavigationAction label="Families" icon={<PeopleIcon />} />
              <BottomNavigationAction label="Tasks" icon={<AssignmentIcon />} />
            </BottomNavigation>
          </Paper>
        )}
      </>
    );
  },
  parameters: {
    // Allow viewport switching in Storybook toolbar
    viewport: {
      defaultViewport: "responsive",
    },
  },
};
