import type { Meta, StoryObj } from "@storybook/react-vite";
import { AccessiblePopover } from "./AccessiblePopover";
import { Box, Typography, Chip, IconButton, Paper } from "@mui/material";
import { Info as InfoIcon, Help as HelpIcon } from "@mui/icons-material";

const meta: Meta<typeof AccessiblePopover> = {
  title: "Components/Display/AccessiblePopover",
  component: AccessiblePopover,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof AccessiblePopover>;

/**
 * Basic popover that appears when hovering over text
 */
export const Basic: Story = {
  render: () => (
    <AccessiblePopover
      popoverContent={
        <Box sx={{ p: 2 }}>
          <Typography>This is a helpful popover message</Typography>
        </Box>
      }
    >
      <Typography sx={{ cursor: "pointer", textDecoration: "underline" }}>Hover over me</Typography>
    </AccessiblePopover>
  ),
};

/**
 * Popover on an icon button providing additional information
 */
export const WithIconButton: Story = {
  render: () => (
    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
      <Typography>User Profile</Typography>
      <AccessiblePopover
        popoverContent={
          <Paper sx={{ p: 2, maxWidth: 250 }}>
            <Typography variant="body2">
              View and edit your profile information, including your name, email, and preferences.
            </Typography>
          </Paper>
        }
      >
        <IconButton size="small">
          <InfoIcon fontSize="small" />
        </IconButton>
      </AccessiblePopover>
    </Box>
  ),
};

/**
 * Popover with custom positioning
 */
export const CustomPosition: Story = {
  render: () => (
    <Box sx={{ display: "flex", gap: 4 }}>
      <AccessiblePopover
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        popoverContent={
          <Box sx={{ p: 2 }}>
            <Typography variant="body2">Appears above</Typography>
          </Box>
        }
      >
        <Chip label="Top Position" />
      </AccessiblePopover>

      <AccessiblePopover
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        popoverContent={
          <Box sx={{ p: 2 }}>
            <Typography variant="body2">Appears bottom-right</Typography>
          </Box>
        }
      >
        <Chip label="Bottom-Right Position" />
      </AccessiblePopover>
    </Box>
  ),
};

/**
 * Popover with rich content including multiple elements
 */
export const RichContent: Story = {
  render: () => (
    <AccessiblePopover
      popoverContent={
        <Paper sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="h6" gutterBottom>
            Feature Explanation
          </Typography>
          <Typography variant="body2" paragraph>
            This feature allows you to manage your account settings with fine-grained control.
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <Chip label="Settings" size="small" color="primary" />
            <Chip label="Privacy" size="small" color="secondary" />
          </Box>
        </Paper>
      }
    >
      <Box
        sx={{
          p: 2,
          border: "1px dashed",
          borderColor: "primary.main",
          borderRadius: 1,
          cursor: "pointer",
        }}
      >
        <HelpIcon sx={{ mr: 1, verticalAlign: "middle" }} />
        <Typography component="span">What is this feature?</Typography>
      </Box>
    </AccessiblePopover>
  ),
};

/**
 * Disabled popover that doesn't show on hover
 */
export const Disabled: Story = {
  render: () => (
    <Box>
      <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
        The popover is disabled and will not appear
      </Typography>
      <AccessiblePopover
        disabled
        popoverContent={
          <Box sx={{ p: 2 }}>
            <Typography>You should not see this</Typography>
          </Box>
        }
      >
        <Typography sx={{ cursor: "not-allowed", color: "text.disabled" }}>
          Hover over me (disabled)
        </Typography>
      </AccessiblePopover>
    </Box>
  ),
};

/**
 * Multiple popovers demonstrating different use cases
 */
export const Multiple: Story = {
  render: () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <Typography>Name:</Typography>
        <AccessiblePopover
          popoverContent={
            <Box sx={{ p: 1.5 }}>
              <Typography variant="caption">Full legal name</Typography>
            </Box>
          }
        >
          <IconButton size="small">
            <HelpIcon fontSize="small" />
          </IconButton>
        </AccessiblePopover>
      </Box>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <Typography>Email:</Typography>
        <AccessiblePopover
          popoverContent={
            <Box sx={{ p: 1.5 }}>
              <Typography variant="caption">Primary contact email</Typography>
            </Box>
          }
        >
          <IconButton size="small">
            <HelpIcon fontSize="small" />
          </IconButton>
        </AccessiblePopover>
      </Box>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <Typography>Phone:</Typography>
        <AccessiblePopover
          popoverContent={
            <Box sx={{ p: 1.5 }}>
              <Typography variant="caption">Mobile number with country code</Typography>
            </Box>
          }
        >
          <IconButton size="small">
            <HelpIcon fontSize="small" />
          </IconButton>
        </AccessiblePopover>
      </Box>
    </Box>
  ),
};

/**
 * Popover with custom styling
 */
export const CustomStyling: Story = {
  render: () => (
    <AccessiblePopover
      sx={{
        "& .MuiPaper-root": {
          backgroundColor: "warning.light",
          borderRadius: 2,
        },
      }}
      popoverContent={
        <Box sx={{ p: 2 }}>
          <Typography sx={{ color: "warning.contrastText" }}>
            Custom styled popover with warning colors
          </Typography>
        </Box>
      }
    >
      <Chip label="Custom Style" color="warning" />
    </AccessiblePopover>
  ),
};
