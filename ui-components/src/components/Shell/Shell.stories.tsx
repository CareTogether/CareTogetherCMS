import type { Meta, StoryObj } from "@storybook/react";
import { Shell } from "./Shell";
import {
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Container,
  Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircle from "@mui/icons-material/AccountCircle";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
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
 */
export const Complete: Story = {
  render: () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
      <Shell>
        <Shell.Header
          leftContent={
            <>
              <IconButton
                color="inherit"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                edge="start"
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" noWrap>
                CareTogether CMS
              </Typography>
            </>
          }
          rightContent={
            <IconButton color="inherit">
              <AccountCircle />
            </IconButton>
          }
        />

        <Box sx={{ display: "flex", flexGrow: 1 }}>
          <Shell.Sidebar open={sidebarOpen} width={240}>
            <List>
              <ListItem button>
                <ListItemIcon>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItem>
              <ListItem button>
                <ListItemIcon>
                  <PeopleIcon />
                </ListItemIcon>
                <ListItemText primary="Families" />
              </ListItem>
              <ListItem button>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </ListItem>
            </List>
          </Shell.Sidebar>

          <Shell.Content marginTop="64px" marginLeft={sidebarOpen ? "240px" : "0"}>
            <Container sx={{ py: 4 }}>
              <Typography variant="h4" gutterBottom>
                Welcome to CareTogether
              </Typography>
              <Typography variant="body1" paragraph>
                This is an example of the Shell compound component pattern. The header, sidebar,
                content area, and footer are all composable parts that you can customize.
              </Typography>
              <Button variant="contained" color="primary">
                Get Started
              </Button>
            </Container>
          </Shell.Content>
        </Box>

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

      <Shell.Content marginTop="64px">
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
          <IconButton color="inherit">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6">My App</Typography>
        </Box>
      }
      centerContent={<Typography variant="body1">Dashboard</Typography>}
      rightContent={
        <>
          <Button color="inherit">Login</Button>
          <IconButton color="inherit">
            <AccountCircle />
          </IconButton>
        </>
      }
    />
  ),
};

/**
 * Sidebar component in isolation.
 */
export const SidebarOnly: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <Box sx={{ display: "flex", height: "100vh" }}>
        <Shell.Sidebar open={open} width={240}>
          <Box sx={{ p: 2 }}>
            <Button fullWidth variant="outlined" onClick={() => setOpen(!open)}>
              Toggle Sidebar
            </Button>
          </Box>
          <List>
            <ListItem button>
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="Users" />
            </ListItem>
          </List>
        </Shell.Sidebar>

        <Box sx={{ flexGrow: 1, p: 3 }}>
          <Typography variant="h5">Main Content Area</Typography>
          <Typography variant="body1">The sidebar is {open ? "open" : "closed"}.</Typography>
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
 * Fixed header and footer with scrollable content.
 */
export const FixedHeaderFooter: Story = {
  render: () => (
    <Shell>
      <Shell.Header
        position="fixed"
        leftContent={<Typography variant="h6">Fixed Layout</Typography>}
      />

      <Shell.Content marginTop="64px" marginBottom="48px">
        <Container sx={{ py: 4 }}>
          {Array.from({ length: 50 }, (_, i) => (
            <Typography key={i} paragraph>
              Content line {i + 1}. Scroll to see the fixed header and footer in action.
            </Typography>
          ))}
        </Container>
      </Shell.Content>

      <Shell.Footer position="fixed">
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Fixed footer stays at bottom
        </Typography>
      </Shell.Footer>
    </Shell>
  ),
};
