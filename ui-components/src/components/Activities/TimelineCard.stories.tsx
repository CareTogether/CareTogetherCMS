import type { Meta, StoryObj } from "@storybook/react";
import { TimelineCard } from "./TimelineCard";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import { Button } from "@mui/material";

const meta = {
  title: "Components/Display/TimelineCard",
  component: TimelineCard,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TimelineCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to create icon with background
const TimelineIcon = ({ color, Icon }: { color: string; Icon: typeof HomeIcon }) => (
  <Icon sx={{ color }} />
);

const sampleItems = [
  {
    timestamp: "07/28/2025 3:38 PM",
    icon: <TimelineIcon color="#07666C" Icon={HomeIcon} />,
    name: "John Doe",
    description: "With parent",
  },
  {
    timestamp: "07/28/2025 3:38 PM",
    icon: <TimelineIcon color="#07666C" Icon={PersonIcon} />,
    name: "John Doe",
    description: "Overnight housing",
  },
  {
    timestamp: "07/07/2025 3:38 PM",
    icon: <TimelineIcon color="#07666C" Icon={HomeIcon} />,
    name: "John Doe",
    description: "Daytime child care",
  },
];

export const Default: Story = {
  args: {
    title: "Header",
    subHeader: "Sub Header",
    items: sampleItems,
  },
};

export const WithActions: Story = {
  args: {
    title: "Header",
    subHeader: "Sub Header",
    actions: (
      <>
        <Button
          variant="contained"
          onClick={() => console.log("Primary action clicked")}
          sx={{ borderRadius: "24px", textTransform: "none", px: 3 }}
        >
          + Label
        </Button>
        <Button
          variant="outlined"
          onClick={() => console.log("Secondary action clicked")}
          sx={{ borderRadius: "24px", textTransform: "none", px: 3 }}
        >
          Label
        </Button>
      </>
    ),
    items: sampleItems,
  },
};

export const WithoutSubHeader: Story = {
  args: {
    title: "Timeline History",
    actions: (
      <>
        <Button
          variant="contained"
          onClick={() => console.log("Add entry clicked")}
          sx={{ borderRadius: "24px", textTransform: "none", px: 3 }}
        >
          + Add Entry
        </Button>
        <Button
          variant="outlined"
          onClick={() => console.log("Export clicked")}
          sx={{ borderRadius: "24px", textTransform: "none", px: 3 }}
        >
          Export
        </Button>
      </>
    ),
    items: sampleItems,
  },
};

export const WithoutHeader: Story = {
  args: {
    items: sampleItems,
  },
};

export const SingleItem: Story = {
  args: {
    title: "Recent Activity",
    items: [
      {
        timestamp: "07/28/2025 3:38 PM",
        icon: <TimelineIcon color="#07666C" Icon={HomeIcon} />,
        name: "John Doe",
        description: "With parent",
      },
    ],
  },
};

export const ManyItems: Story = {
  args: {
    title: "Placement History",
    subHeader: "Child Location Timeline",
    actions: (
      <Button
        variant="contained"
        onClick={() => console.log("Add location clicked")}
        sx={{ borderRadius: "24px", textTransform: "none", px: 3 }}
      >
        + Add Location
      </Button>
    ),
    items: [
      {
        timestamp: "12/31/2025 10:00 AM",
        icon: <TimelineIcon color="#07666C" Icon={HomeIcon} />,
        name: "John Doe",
        description: "With parent",
      },
      {
        timestamp: "12/30/2025 3:38 PM",
        icon: <TimelineIcon color="#2E7D32" Icon={PersonIcon} />,
        name: "Jane Smith",
        description: "Overnight housing",
      },
      {
        timestamp: "12/15/2025 9:15 AM",
        icon: <TimelineIcon color="#1976D2" Icon={HomeIcon} />,
        name: "Bob Johnson",
        description: "Daytime child care",
      },
      {
        timestamp: "12/01/2025 2:00 PM",
        icon: <TimelineIcon color="#D32F2F" Icon={PersonIcon} />,
        name: "Alice Williams",
        description: "Weekend respite",
      },
      {
        timestamp: "11/20/2025 11:30 AM",
        icon: <TimelineIcon color="#F57C00" Icon={HomeIcon} />,
        name: "Charlie Brown",
        description: "Emergency placement",
      },
      {
        timestamp: "11/01/2025 8:00 AM",
        icon: <TimelineIcon color="#7B1FA2" Icon={HomeIcon} />,
        name: "Diana Prince",
        description: "Long-term foster care",
      },
    ],
  },
};

export const EmptyState: Story = {
  args: {
    title: "Placement History",
    subHeader: "No placements recorded",
    actions: (
      <Button
        variant="contained"
        onClick={() => console.log("Add location clicked")}
        sx={{ borderRadius: "24px", textTransform: "none", px: 3 }}
      >
        + Add Location
      </Button>
    ),
    items: [],
  },
};

export const EmptyWithCustomMessage: Story = {
  args: {
    title: "Timeline",
    items: [],
    emptyMessage: "No timeline entries have been recorded yet.",
  },
};
