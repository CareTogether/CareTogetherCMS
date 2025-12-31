import type { Meta, StoryObj } from "@storybook/react";
import { ActivityItem } from "./ActivityItem";
import { ActivityIcon } from "./ActivityIcon";
import { Box, Link, Button } from "@mui/material";

const meta = {
  title: "Components/Activities/ActivityItem",
  component: ActivityItem,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ActivityItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLink: Story = {
  args: {
    icon: <ActivityIcon color="#FDD835" />,
    time: "10:30 AM",
    title: "New referral created",
    action: (
      <Link href="#" sx={{ fontSize: "0.875rem" }}>
        View referral
      </Link>
    ),
  },
};

export const WithButton: Story = {
  args: {
    icon: <ActivityIcon color="#66BB6A" />,
    time: "2:45 PM",
    title: "Volunteer assigned",
    action: (
      <Button
        size="small"
        variant="text"
        onClick={() => console.log("Button clicked")}
        sx={{ fontSize: "0.875rem", p: 0, minWidth: 0 }}
      >
        View details
      </Button>
    ),
  },
};

export const WithClickableLink: Story = {
  args: {
    icon: <ActivityIcon color="#AB47BC" />,
    time: "Yesterday",
    title: "Document uploaded",
    action: (
      <Link
        component="button"
        onClick={() => console.log("Link clicked")}
        sx={{ fontSize: "0.875rem" }}
      >
        Open document
      </Link>
    ),
  },
};

export const NoAction: Story = {
  args: {
    icon: <ActivityIcon color="#42A5F5" />,
    time: "11:00 AM",
    title: "Status updated to in progress",
  },
};

export const LongText: Story = {
  args: {
    icon: <ActivityIcon color="#EF5350" />,
    time: "11:00 AM",
    title: "This is a very long activity title that might wrap to multiple lines",
    action: (
      <Link href="#" sx={{ fontSize: "0.875rem" }}>
        View more information
      </Link>
    ),
  },
};

export const MultipleItems: Story = {
  render: () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 400 }}>
      <ActivityItem
        icon={<ActivityIcon color="#FDD835" />}
        time="10:30 AM"
        title="New referral created"
        action={
          <Link href="#" sx={{ fontSize: "0.875rem" }}>
            View referral
          </Link>
        }
      />
      <ActivityItem
        icon={<ActivityIcon color="#66BB6A" />}
        time="2:45 PM"
        title="Volunteer assigned"
        action={
          <Link href="#" sx={{ fontSize: "0.875rem" }}>
            View details
          </Link>
        }
      />
      <ActivityItem
        icon={<ActivityIcon color="#AB47BC" />}
        time="Yesterday"
        title="Document uploaded"
        action={
          <Link href="#" sx={{ fontSize: "0.875rem" }}>
            Open document
          </Link>
        }
      />
      <ActivityItem
        icon={<ActivityIcon color="#42A5F5" />}
        time="2 days ago"
        title="Status changed"
      />
    </Box>
  ),
};
