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
    color: {
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
    size: "medium",
  },
};

export const SmallSize: Story = {
  args: {
    label: "Small Chip",
    size: "small",
  },
};

export const MediumSize: Story = {
  args: {
    label: "Medium Chip",
    size: "medium",
  },
};

export const WithSuccessIcon: Story = {
  args: {
    label: "Approved",
    startIcon: <CheckCircleIcon />,
    color: "success",
    size: "medium",
  },
};

export const WithInfoIcon: Story = {
  args: {
    label: "In Progress",
    startIcon: <CircleIcon />,
    color: "info",
    size: "medium",
  },
};

export const WithWarningIcon: Story = {
  args: {
    label: "Pending",
    startIcon: <WarningIcon />,
    color: "warning",
    size: "medium",
  },
};

export const WithErrorIcon: Story = {
  args: {
    label: "Rejected",
    startIcon: <ErrorIcon />,
    color: "error",
    size: "medium",
  },
};

export const WithCustomColor: Story = {
  args: {
    label: "Custom Status",
    startIcon: <StarIcon />,
    color: "#9C27B0",
    size: "medium",
  },
};

export const AllThemeColors: Story = {
  render: () => (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
      <ColoredChip label="Success" startIcon={<CheckCircleIcon />} color="success" />
      <ColoredChip label="Info" startIcon={<InfoIcon />} color="info" />
      <ColoredChip label="Warning" startIcon={<WarningIcon />} color="warning" />
      <ColoredChip label="Error" startIcon={<ErrorIcon />} color="error" />
      <ColoredChip label="Primary" startIcon={<CircleIcon />} color="primary" />
      <ColoredChip label="Secondary" startIcon={<CircleIcon />} color="secondary" />
      <ColoredChip label="Default" startIcon={<CircleIcon />} />
    </Box>
  ),
};

export const SizeComparison: Story = {
  render: () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <ColoredChip label="Small" size="small" />
        <ColoredChip
          label="Small with Icon"
          startIcon={<CheckCircleIcon />}
          color="success"
          size="small"
        />
      </Box>
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <ColoredChip label="Medium" size="medium" />
        <ColoredChip
          label="Medium with Icon"
          startIcon={<CheckCircleIcon />}
          color="success"
          size="medium"
        />
      </Box>
    </Box>
  ),
};
