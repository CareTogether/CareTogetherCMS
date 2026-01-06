import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import { ScheduleItem } from "./ScheduleItem";

const meta: Meta<typeof ScheduleItem> = {
  title: "Components/Display/ScheduleItem",
  component: ScheduleItem,
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
    },
    color: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "success",
        "info",
        "warning",
        "error",
        "#9C27B0",
        "#FF5722",
      ],
    },
    size: {
      control: "select",
      options: ["small", "medium", "large"],
    },
    component: {
      control: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof ScheduleItem>;

/**
 * Basic non-interactive schedule item with just a label and color.
 */
export const Basic: Story = {
  args: {
    label: "Team Meeting",
    color: "#9C27B0",
  },
};

/**
 * Schedule item with a start icon for visual context.
 */
export const WithIcon: Story = {
  args: {
    label: "Ride share for Elena",
    color: "#9C27B0",
    startIcon: <DirectionsCarIcon />,
  },
};

/**
 * Schedule item rendered as a link (using anchor tag).
 * In a real app, you'd use React Router's Link component.
 */
export const AsLink: Story = {
  args: {
    label: "Babysitting Isabel and Diego",
    color: "#1976D2",
    component: "a",
    href: "#",
    startIcon: <ChildCareIcon />,
  },
};

/**
 * Schedule item rendered as a button with click handler.
 */
export const AsButton: Story = {
  args: {
    label: "Doctor Appointment",
    color: "error",
    component: "button",
    onClick: () => alert("Schedule item clicked!"),
    startIcon: <MedicalServicesIcon />,
  },
};

/**
 * Small size variant - more compact for lists.
 */
export const SmallSize: Story = {
  args: {
    label: "Quick Task",
    color: "success",
    size: "small",
    startIcon: <EventIcon />,
  },
};

/**
 * Large size variant - more prominent display.
 */
export const LargeSize: Story = {
  args: {
    label: "Important Event",
    color: "warning",
    size: "large",
    startIcon: <EventIcon />,
  },
};

/**
 * Using theme color keys instead of hex values.
 */
export const ThemeColors: Story = {
  render: () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 400 }}>
      <ScheduleItem label="Primary Schedule" color="primary" startIcon={<EventIcon />} />
      <ScheduleItem label="Secondary Schedule" color="secondary" startIcon={<EventIcon />} />
      <ScheduleItem label="Success Schedule" color="success" startIcon={<EventIcon />} />
      <ScheduleItem label="Info Schedule" color="info" startIcon={<EventIcon />} />
      <ScheduleItem label="Warning Schedule" color="warning" startIcon={<EventIcon />} />
      <ScheduleItem label="Error Schedule" color="error" startIcon={<EventIcon />} />
    </Box>
  ),
};

/**
 * Custom hex colors for brand-specific schedules.
 */
export const CustomColors: Story = {
  render: () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 400 }}>
      <ScheduleItem label="Purple Schedule" color="#9C27B0" startIcon={<EventIcon />} />
      <ScheduleItem label="Orange Schedule" color="#FF5722" startIcon={<EventIcon />} />
      <ScheduleItem label="Teal Schedule" color="#009688" startIcon={<EventIcon />} />
      <ScheduleItem label="Pink Schedule" color="#E91E63" startIcon={<EventIcon />} />
    </Box>
  ),
};

/**
 * Different sizes compared side by side.
 */
export const SizeComparison: Story = {
  render: () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 400 }}>
      <ScheduleItem label="Small Schedule" color="primary" size="small" startIcon={<EventIcon />} />
      <ScheduleItem
        label="Medium Schedule"
        color="primary"
        size="medium"
        startIcon={<EventIcon />}
      />
      <ScheduleItem label="Large Schedule" color="primary" size="large" startIcon={<EventIcon />} />
    </Box>
  ),
};
