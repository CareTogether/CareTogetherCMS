import type { Meta, StoryObj } from "npm:@storybook/react@^8.0.0";
import { NavItem } from "./NavItem.tsx";
import { Box } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";
import FolderIcon from "@mui/icons-material/Folder";
import SettingsIcon from "@mui/icons-material/Settings";
import DashboardIcon from "@mui/icons-material/Dashboard";

const meta: Meta<typeof NavItem> = {
  title: "Navigation/NavItem",
  component: NavItem,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof NavItem>;

export const Default: Story = {
  args: {
    icon: <HomeIcon />,
    text: "Dashboard",
  },
  decorators: [
    (Story: React.ComponentType) => (
      <Box sx={{ width: 250 }}>
        <Story />
      </Box>
    ),
  ],
};

export const Collapsed: Story = {
  args: {
    icon: <HomeIcon />,
    text: "Dashboard",
    collapsed: true,
  },
  decorators: [
    (Story: React.ComponentType) => (
      <Box sx={{ width: 64 }}>
        <Story />
      </Box>
    ),
  ],
};

export const MultipleItems: Story = {
  render: () => (
    <Box sx={{ width: 250, display: "flex", flexDirection: "column", gap: 0.5 }}>
      <NavItem icon={<DashboardIcon />} text="Dashboard" />
      <NavItem icon={<PeopleIcon />} text="Families" />
      <NavItem icon={<FolderIcon />} text="Cases" />
      <NavItem icon={<SettingsIcon />} text="Settings" />
    </Box>
  ),
};

export const MultipleItemsCollapsed: Story = {
  render: () => (
    <Box sx={{ width: 64, display: "flex", flexDirection: "column", gap: 0.5 }}>
      <NavItem icon={<DashboardIcon />} text="Dashboard" collapsed />
      <NavItem icon={<PeopleIcon />} text="Families" collapsed />
      <NavItem icon={<FolderIcon />} text="Cases" collapsed />
      <NavItem icon={<SettingsIcon />} text="Settings" collapsed />
    </Box>
  ),
};

export const WithClickHandler: Story = {
  args: {
    icon: <HomeIcon />,
    text: "Dashboard",
    onClick: () => alert("Navigation item clicked!"),
  },
  decorators: [
    (Story: React.ComponentType) => (
      <Box sx={{ width: 250 }}>
        <Story />
      </Box>
    ),
  ],
};

export const CustomStyling: Story = {
  args: {
    icon: <HomeIcon />,
    text: "Custom Styled",
    sx: {
      borderRadius: 4,
      px: 3,
    },
  },
  decorators: [
    (Story: React.ComponentType) => (
      <Box sx={{ width: 250 }}>
        <Story />
      </Box>
    ),
  ],
};

export const AsLink: Story = {
  args: {
    icon: <HomeIcon />,
    text: "External Link",
    component: "a",
    href: "https://example.com",
    target: "_blank",
    rel: "noopener noreferrer",
  },
  decorators: [
    (Story: React.ComponentType) => (
      <Box sx={{ width: 250 }}>
        <Story />
      </Box>
    ),
  ],
};

export const AsDiv: Story = {
  args: {
    icon: <SettingsIcon />,
    text: "Div Element",
    component: "div",
    onClick: () => alert("Div clicked!"),
  },
  decorators: [
    (Story: React.ComponentType) => (
      <Box sx={{ width: 250 }}>
        <Story />
      </Box>
    ),
  ],
};
