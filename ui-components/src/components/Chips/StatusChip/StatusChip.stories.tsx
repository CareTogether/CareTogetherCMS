import type { Meta, StoryObj } from "npm:@storybook/react@^8.0.0";
import { Box } from "@mui/material";
import { StatusChip } from "./StatusChip.tsx";

const meta: Meta<typeof StatusChip> = {
  title: "Chips/StatusChip",
  component: StatusChip,
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: "select",
      options: ["active", "inactive", "pending", "approved", "rejected", "completed", "in-progress"],
    },
    size: {
      control: "select",
      options: ["small", "medium"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusChip>;

export const Active: Story = {
  args: {
    status: "active",
  },
};

export const Inactive: Story = {
  args: {
    status: "inactive",
  },
};

export const Pending: Story = {
  args: {
    status: "pending",
  },
};

export const Approved: Story = {
  args: {
    status: "approved",
  },
};

export const Rejected: Story = {
  args: {
    status: "rejected",
  },
};

export const Completed: Story = {
  args: {
    status: "completed",
  },
};

export const InProgress: Story = {
  args: {
    status: "in-progress",
  },
};

export const CustomLabel: Story = {
  args: {
    status: "pending",
    label: "Awaiting Approval",
  },
};

export const AllStatuses: Story = {
  render: () => (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
      <StatusChip status="active" />
      <StatusChip status="inactive" />
      <StatusChip status="pending" />
      <StatusChip status="approved" />
      <StatusChip status="rejected" />
      <StatusChip status="completed" />
      <StatusChip status="in-progress" />
    </Box>
  ),
};
