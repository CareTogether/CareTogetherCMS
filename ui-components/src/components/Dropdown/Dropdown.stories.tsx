import type { Meta, StoryObj } from "@storybook/react-vite";
import { Dropdown } from "./Dropdown";
import { MenuItem, ListItemIcon, ListItemText, Divider, Box, Typography } from "@mui/material";
import {
  Settings as SettingsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  ArrowDropDown as ArrowDropDownIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterListIcon,
} from "@mui/icons-material";
import React from "react";

const meta: Meta<typeof Dropdown> = {
  title: "Components/Navigation/Dropdown",
  component: Dropdown,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

/**
 * Basic dropdown with a button trigger and menu items
 */
export const Basic: Story = {
  render: () => (
    <Dropdown>
      <Dropdown.Button variant="contained" endIcon={<ArrowDropDownIcon />}>
        Options
      </Dropdown.Button>
      <Dropdown.Menu>
        <MenuItem>Profile</MenuItem>
        <MenuItem>Settings</MenuItem>
        <MenuItem>Logout</MenuItem>
      </Dropdown.Menu>
    </Dropdown>
  ),
};

/**
 * Dropdown with icon button trigger
 */
export const WithIconButton: Story = {
  render: () => (
    <Dropdown>
      <Dropdown.IconButton>
        <MoreVertIcon />
      </Dropdown.IconButton>
      <Dropdown.Menu>
        <MenuItem>Edit</MenuItem>
        <MenuItem>Delete</MenuItem>
        <MenuItem>Share</MenuItem>
      </Dropdown.Menu>
    </Dropdown>
  ),
};

/**
 * Dropdown with icons and dividers in menu items
 */
export const WithIcons: Story = {
  render: () => (
    <Dropdown>
      <Dropdown.Button variant="outlined" endIcon={<ArrowDropDownIcon />}>
        Account
      </Dropdown.Button>
      <Dropdown.Menu>
        <MenuItem>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Dropdown.Menu>
    </Dropdown>
  ),
};

/**
 * Dropdown with different placement options
 */
export const Placements: Story = {
  render: () => (
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      <Dropdown>
        <Dropdown.Button variant="contained">Bottom Start</Dropdown.Button>
        <Dropdown.Menu placement="bottom-start">
          <MenuItem>Item 1</MenuItem>
          <MenuItem>Item 2</MenuItem>
          <MenuItem>Item 3</MenuItem>
        </Dropdown.Menu>
      </Dropdown>

      <Dropdown>
        <Dropdown.Button variant="contained">Bottom End</Dropdown.Button>
        <Dropdown.Menu placement="bottom-end">
          <MenuItem>Item 1</MenuItem>
          <MenuItem>Item 2</MenuItem>
          <MenuItem>Item 3</MenuItem>
        </Dropdown.Menu>
      </Dropdown>

      <Dropdown>
        <Dropdown.Button variant="contained">Top Start</Dropdown.Button>
        <Dropdown.Menu placement="top-start">
          <MenuItem>Item 1</MenuItem>
          <MenuItem>Item 2</MenuItem>
          <MenuItem>Item 3</MenuItem>
        </Dropdown.Menu>
      </Dropdown>

      <Dropdown>
        <Dropdown.Button variant="contained">Top End</Dropdown.Button>
        <Dropdown.Menu placement="top-end">
          <MenuItem>Item 1</MenuItem>
          <MenuItem>Item 2</MenuItem>
          <MenuItem>Item 3</MenuItem>
        </Dropdown.Menu>
      </Dropdown>
    </Box>
  ),
};

/**
 * Dropdown that closes automatically when a menu item is clicked
 */
export const CloseOnItemClick: Story = {
  render: () => (
    <Dropdown>
      <Dropdown.Button variant="contained" startIcon={<FilterListIcon />}>
        Filter
      </Dropdown.Button>
      <Dropdown.Menu closeOnItemClick>
        <MenuItem>All Items</MenuItem>
        <MenuItem>Active Only</MenuItem>
        <MenuItem>Archived Only</MenuItem>
        <MenuItem>Recent</MenuItem>
      </Dropdown.Menu>
    </Dropdown>
  ),
};

/**
 * Controlled dropdown where parent manages the open state
 */
export const Controlled: Story = {
  render: function ControlledDropdown() {
    const [open, setOpen] = React.useState(false);

    return (
      <Box>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Menu is currently: {open ? "Open" : "Closed"}
        </Typography>
        <Dropdown open={open} setOpen={setOpen}>
          <Dropdown.Button variant="contained">Controlled Menu</Dropdown.Button>
          <Dropdown.Menu>
            <MenuItem onClick={() => setOpen(false)}>Close Menu</MenuItem>
            <MenuItem>Keep Open</MenuItem>
          </Dropdown.Menu>
        </Dropdown>
      </Box>
    );
  },
};

/**
 * Dropdown with various button variants and colors
 */
export const ButtonVariants: Story = {
  render: () => (
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      <Dropdown>
        <Dropdown.Button variant="contained" color="primary">
          Contained Primary
        </Dropdown.Button>
        <Dropdown.Menu>
          <MenuItem>Option 1</MenuItem>
          <MenuItem>Option 2</MenuItem>
        </Dropdown.Menu>
      </Dropdown>

      <Dropdown>
        <Dropdown.Button variant="outlined" color="secondary">
          Outlined Secondary
        </Dropdown.Button>
        <Dropdown.Menu>
          <MenuItem>Option 1</MenuItem>
          <MenuItem>Option 2</MenuItem>
        </Dropdown.Menu>
      </Dropdown>

      <Dropdown>
        <Dropdown.Button variant="text">Text Button</Dropdown.Button>
        <Dropdown.Menu>
          <MenuItem>Option 1</MenuItem>
          <MenuItem>Option 2</MenuItem>
        </Dropdown.Menu>
      </Dropdown>

      <Dropdown>
        <Dropdown.IconButton color="primary">
          <SettingsIcon />
        </Dropdown.IconButton>
        <Dropdown.Menu>
          <MenuItem>Option 1</MenuItem>
          <MenuItem>Option 2</MenuItem>
        </Dropdown.Menu>
      </Dropdown>
    </Box>
  ),
};
