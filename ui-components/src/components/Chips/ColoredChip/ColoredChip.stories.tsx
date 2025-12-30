import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import StarIcon from "@mui/icons-material/Star";
import { ColoredChip } from "./ColoredChip";

const meta: Meta<typeof ColoredChip> = {
  title: "Chips/ColoredChip",
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
    icon: <CheckCircleIcon />,
    iconColor: "success",
  },
};

export const WithInfoIcon: Story = {
  args: {
    label: "In Progress",
    icon: <CircleIcon />,
    iconColor: "info",
  },
};

export const WithWarningIcon: Story = {
  args: {
    label: "Pending",
    icon: <WarningIcon />,
    iconColor: "warning",
  },
};

export const WithErrorIcon: Story = {
  args: {
    label: "Rejected",
    icon: <ErrorIcon />,
    iconColor: "error",
  },
};

export const WithCustomColor: Story = {
  args: {
    label: "Custom Status",
    icon: <StarIcon />,
    iconColor: "#9C27B0",
  },
};

export const AllThemeColors: Story = {
  render: () => (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
      <ColoredChip label="Success" icon={<CheckCircleIcon />} iconColor="success" />
      <ColoredChip label="Info" icon={<InfoIcon />} iconColor="info" />
      <ColoredChip label="Warning" icon={<WarningIcon />} iconColor="warning" />
      <ColoredChip label="Error" icon={<ErrorIcon />} iconColor="error" />
      <ColoredChip label="Primary" icon={<CircleIcon />} iconColor="primary" />
      <ColoredChip label="Secondary" icon={<CircleIcon />} iconColor="secondary" />
      <ColoredChip label="Default" icon={<CircleIcon />} />
    </Box>
  ),
};
