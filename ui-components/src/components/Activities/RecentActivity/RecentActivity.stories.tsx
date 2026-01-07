import type { Meta, StoryObj } from "@storybook/react";
import { RecentActivity } from "./RecentActivity";
import { ActivityItem } from "../ActivityItem";
import { ActivityIcon } from "../ActivityIcon";
import { Link } from "@mui/material";

const meta = {
  title: "Components/Display/RecentActivity",
  component: RecentActivity,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof RecentActivity>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Complete: Story = {
  render: () => (
    <RecentActivity>
      <RecentActivity.Header action={<Link href="#">View all</Link>}>
        Recent Activity
      </RecentActivity.Header>

      <RecentActivity.Group title="Today">
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
      </RecentActivity.Group>

      <RecentActivity.Group title="Yesterday">
        <ActivityItem
          icon={<ActivityIcon color="#AB47BC" />}
          time="3:15 PM"
          title="Document uploaded"
          action={
            <Link href="#" sx={{ fontSize: "0.875rem" }}>
              Open document
            </Link>
          }
        />
        <ActivityItem
          icon={<ActivityIcon color="#42A5F5" />}
          time="11:00 AM"
          title="Status updated"
          action={
            <Link href="#" sx={{ fontSize: "0.875rem" }}>
              View status
            </Link>
          }
        />
      </RecentActivity.Group>
    </RecentActivity>
  ),
};

export const NoHeader: Story = {
  render: () => (
    <RecentActivity>
      <RecentActivity.Group title="Today">
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
      </RecentActivity.Group>
    </RecentActivity>
  ),
};

export const NoGroupTitles: Story = {
  render: () => (
    <RecentActivity>
      <RecentActivity.Header>Recent Activity</RecentActivity.Header>
      <RecentActivity.Group>
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
      </RecentActivity.Group>
    </RecentActivity>
  ),
};

export const SingleGroup: Story = {
  render: () => (
    <RecentActivity>
      <RecentActivity.Header action={<Link href="#">See more</Link>}>
        Activity
      </RecentActivity.Header>
      <RecentActivity.Group title="This Week">
        <ActivityItem
          icon={<ActivityIcon color="#FDD835" />}
          time="Monday"
          title="Task completed"
          action={
            <Link href="#" sx={{ fontSize: "0.875rem" }}>
              View task
            </Link>
          }
        />
        <ActivityItem
          icon={<ActivityIcon color="#66BB6A" />}
          time="Tuesday"
          title="Meeting scheduled"
          action={
            <Link href="#" sx={{ fontSize: "0.875rem" }}>
              View meeting
            </Link>
          }
        />
        <ActivityItem
          icon={<ActivityIcon color="#AB47BC" />}
          time="Wednesday"
          title="Report submitted"
          action={
            <Link href="#" sx={{ fontSize: "0.875rem" }}>
              View report
            </Link>
          }
        />
      </RecentActivity.Group>
    </RecentActivity>
  ),
};

export const MultipleGroups: Story = {
  render: () => (
    <RecentActivity>
      <RecentActivity.Header action={<Link href="#">View all</Link>}>
        Recent Activity
      </RecentActivity.Header>

      <RecentActivity.Group title="Today">
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
      </RecentActivity.Group>

      <RecentActivity.Group title="Yesterday">
        <ActivityItem
          icon={<ActivityIcon color="#AB47BC" />}
          time="3:15 PM"
          title="Document uploaded"
          action={
            <Link href="#" sx={{ fontSize: "0.875rem" }}>
              Open document
            </Link>
          }
        />
      </RecentActivity.Group>

      <RecentActivity.Group title="This Week">
        <ActivityItem
          icon={<ActivityIcon color="#42A5F5" />}
          time="Monday"
          title="Status updated"
          action={
            <Link href="#" sx={{ fontSize: "0.875rem" }}>
              View status
            </Link>
          }
        />
        <ActivityItem
          icon={<ActivityIcon color="#EF5350" />}
          time="Tuesday"
          title="Approval received"
          action={
            <Link href="#" sx={{ fontSize: "0.875rem" }}>
              View approval
            </Link>
          }
        />
      </RecentActivity.Group>
    </RecentActivity>
  ),
};

export const EmptyState: Story = {
  render: () => (
    <RecentActivity>
      <RecentActivity.Header>Recent Activity</RecentActivity.Header>
      <RecentActivity.Group>
        {/* Empty - consumer could add their own empty state message */}
      </RecentActivity.Group>
    </RecentActivity>
  ),
};
