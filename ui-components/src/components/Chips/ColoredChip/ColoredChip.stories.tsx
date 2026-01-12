import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import StarIcon from "@mui/icons-material/Star";
import { ColoredChip } from "./ColoredChip";

const meta: Meta<typeof ColoredChip> = {
  title: "Components/Display/ColoredChip",
  component: ColoredChip,
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
    },
    iconColor: {
      control: "select",
      options: ["success", "info", "warning", "error", "primary", "secondary", "grey.900"],
    },
    size: {
      control: "select",
      options: ["small", "medium"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ColoredChip>;

export const Basic: Story = {
  args: {
    label: "Basic Chip",
  },
};

export const WithSuccessIcon: Story = {
  args: {
    label: "Approved",
    startIcon: <CheckCircleIcon />,
    iconColor: "success",
  },
};

export const WithInfoIcon: Story = {
  args: {
    label: "In Progress",
    startIcon: <CircleIcon />,
    iconColor: "info",
  },
};

export const WithWarningIcon: Story = {
  args: {
    label: "Pending",
    startIcon: <WarningIcon />,
    iconColor: "warning",
  },
};

export const WithErrorIcon: Story = {
  args: {
    label: "Rejected",
    startIcon: <ErrorIcon />,
    iconColor: "error",
  },
};

export const WithCustomColor: Story = {
  args: {
    label: "Custom Status",
    startIcon: <StarIcon />,
    iconColor: "#9C27B0",
  },
};

export const AllThemeColors: Story = {
  render: () => (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
      <ColoredChip label="Success" startIcon={<CheckCircleIcon />} iconColor="success" />
      <ColoredChip label="Info" startIcon={<InfoIcon />} iconColor="info" />
      <ColoredChip label="Warning" startIcon={<WarningIcon />} iconColor="warning" />
      <ColoredChip label="Error" startIcon={<ErrorIcon />} iconColor="error" />
      <ColoredChip label="Primary" startIcon={<CircleIcon />} iconColor="primary" />
      <ColoredChip label="Secondary" startIcon={<CircleIcon />} iconColor="secondary" />
      <ColoredChip label="Default" startIcon={<CircleIcon />} />
    </Box>
  ),
};
