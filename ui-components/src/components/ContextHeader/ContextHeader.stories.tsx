import type { Meta, StoryObj } from "@storybook/react";
import { ContextHeader } from "./ContextHeader";
import { ColoredChip } from "../Chips/ColoredChip";
import { Button, Typography, Tab, IconButton, Box } from "@mui/material";
import { useState } from "react";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Tag } from "@mui/icons-material";

const meta: Meta<typeof ContextHeader> = {
  title: "Components/Layout/ContextHeader",
  component: ContextHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <Box sx={{ p: 3 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ContextHeader>;

/**
 * Simple header with just a title
 */
export const Simple: Story = {
  render: () => (
    <ContextHeader>
      <ContextHeader.Title title="Dashboard" />
    </ContextHeader>
  ),
};

/**
 * Header with breadcrumbs
 */
export const WithBreadcrumbs: Story = {
  render: () => (
    <ContextHeader>
      <ContextHeader.Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Families", href: "/families" },
          { label: "Smith Family" },
        ]}
      />
      <ContextHeader.Title title="Smith Family" />
    </ContextHeader>
  ),
};

/**
 * Breadcrumbs with a chip on the right
 */
export const BreadcrumbsWithChip: Story = {
  render: () => (
    <ContextHeader>
      <ContextHeader.Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Families", href: "/families" },
          { label: "Smith Family" },
        ]}
        rightContent={
          <ColoredChip
            startIcon={<AccessTimeFilledIcon />}
            iconColor="error"
            label="Days remaining"
          />
        }
      />
      <ContextHeader.Title title="Smith Family" />
    </ContextHeader>
  ),
};

/**
 * Title with a dropdown (name selector)
 */
export const TitleWithDropdown: Story = {
  render: () => {
    return (
      <ContextHeader>
        <ContextHeader.Breadcrumbs
          items={[
            { label: "Parent page", href: "/" },
            { label: "Child page", href: "/child" },
            { label: "Child page or grandchild page" },
          ]}
        />
        <ContextHeader.Title
          title="John Smith"
          dropdownItems={[
            { label: "John Smith", onClick: () => console.log("Selected John") },
            { label: "Jane Smith", onClick: () => console.log("Selected Jane") },
            { label: "Child Smith", onClick: () => console.log("Selected Child") },
          ]}
        />
      </ContextHeader>
    );
  },
};

/**
 * Title with status chip and action buttons
 */
export const TitleWithChipAndActions: Story = {
  render: () => (
    <ContextHeader>
      <ContextHeader.Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Referrals", href: "/referrals" },
          { label: "Active Referrals" },
        ]}
      />
      <ContextHeader.Title
        title="1 week hosting for newborn baby"
        chip={<ColoredChip label="Primary" iconColor="primary" />}
        actions={
          <>
            <Button variant="outlined" size="small" color="secondary">
              Cancel
            </Button>
            <Button variant="contained" size="small" color="primaryDark">
              Complete
            </Button>
          </>
        }
      />
    </ContextHeader>
  ),
};

/**
 * With descriptive content paragraph
 */
export const WithContentParagraph: Story = {
  render: () => (
    <ContextHeader>
      <ContextHeader.Breadcrumbs
        items={[
          { label: "Parent page", href: "/" },
          { label: "Child page", href: "/child" },
          { label: "Child page or grandchild page" },
        ]}
      />
      <ContextHeader.Title
        title="Referral Name"
        chip={<ColoredChip label="Territory" iconColor="info" />}
        actions={
          <>
            <Button variant="outlined" size="small" color="secondary">
              Decline
            </Button>
            <Button variant="contained" size="small" color="primaryDark">
              Accept
            </Button>
          </>
        }
      />
      <ContextHeader.Content>
        <Typography variant="body2">
          A paragraph of referral notes entered by the staff goes here - this comes from the intake
          process.
        </Typography>
      </ContextHeader.Content>
    </ContextHeader>
  ),
};

/**
 * With metadata details (pipe-separated)
 */
export const WithMetadata: Story = {
  render: () => (
    <ContextHeader>
      <ContextHeader.Breadcrumbs
        items={[
          { label: "Parent page", href: "/" },
          { label: "Child page", href: "/child" },
          { label: "Child page or grandchild page" },
        ]}
      />
      <ContextHeader.Title
        title="Jane Doe"
        chip={<ColoredChip label="Tag" startIcon={<Tag />} />}
        actions={
          <>
            <Button variant="outlined" size="small" color="secondary">
              Edit
            </Button>
            <Button variant="contained" size="small" color="primaryDark">
              Save
            </Button>
          </>
        }
      />
      <ContextHeader.Content>
        <Typography variant="body2">
          Child, 10, Hispanic | Goes to Davidson Elementary School
        </Typography>
      </ContextHeader.Content>
    </ContextHeader>
  ),
};

/**
 * With tabs for navigation
 */
export const WithTabs: Story = {
  render: () => {
    const [tab, setTab] = useState("overview");
    return (
      <ContextHeader>
        <ContextHeader.Breadcrumbs
          items={[
            { label: "Parent page", href: "/" },
            { label: "Child page", href: "/child" },
            { label: "Child page or grandchild page" },
          ]}
        />
        <ContextHeader.Title
          title="Smith Family"
          chip={<ColoredChip label="Tag" startIcon={<Tag />} />}
        />
        <ContextHeader.Content>
          <Typography variant="body2">
            4992 Ridgefield Drive, Charlotte, NC 28105 | 515-705-9341 | elena.flores31@gmail.com
          </Typography>
        </ContextHeader.Content>
        <ContextHeader.Tabs value={tab} onChange={(_, val) => setTab(val)}>
          <Tab label="Overview" value="overview" />
          <Tab label="Arrangements" value="arrangements" />
          <Tab label="Documents" value="documents" />
          <Tab label="Notes and History" value="notes" />
        </ContextHeader.Tabs>
      </ContextHeader>
    );
  },
};

/**
 * Tabs with metadata on the right (created/updated dates)
 */
export const TabsWithMetadata: Story = {
  render: () => {
    const [tab, setTab] = useState("overview");
    return (
      <ContextHeader>
        <ContextHeader.Breadcrumbs
          items={[
            { label: "Parent page", href: "/" },
            { label: "Child page", href: "/child" },
            { label: "Child page or grandchild page" },
          ]}
          rightContent={<ColoredChip label="Secondary" />}
        />
        <ContextHeader.Title
          title="Smith Family"
          chip={<ColoredChip label="Tag" startIcon={<Tag />} />}
        />
        <ContextHeader.Content>
          <Typography variant="body2">Gender, X years old, Culture | School | Source:</Typography>
          <ColoredChip label="Label" sx={{ mt: 1 }} />
        </ContextHeader.Content>
        <ContextHeader.Content>
          <Typography variant="body2">
            4992 Ridgefield Drive, Charlotte, NC 28105 | 515-705-9341 | elena.flores31@gmail.com
          </Typography>
        </ContextHeader.Content>
        <ContextHeader.Content>
          <Typography variant="body2" fontWeight="medium" gutterBottom>
            Referral Summary
          </Typography>
          <Typography variant="body2">
            [name] is being referred to department/person/team for [insert reason or purpose of
            referral]. Key points include brief summary of context, relevant background, or goals.
            Next steps involve actions, follow-up, or expected outcomes.
          </Typography>
        </ContextHeader.Content>
        <ContextHeader.Tabs
          value={tab}
          onChange={(_, val) => setTab(val)}
          rightContent={
            <Typography variant="caption">
              Created: Feb 21, 2025 | Last updated: Feb 24, 2025
            </Typography>
          }
        >
          <Tab label="Overview" value="overview" />
          <Tab label="Arrangements" value="arrangements" />
          <Tab label="Documents" value="documents" />
          <Tab label="Notes and History" value="notes" />
        </ContextHeader.Tabs>
      </ContextHeader>
    );
  },
};

/**
 * Full example showing all features
 */
export const FullExample: Story = {
  render: () => {
    const [tab, setTab] = useState("overview");

    return (
      <ContextHeader>
        <ContextHeader.Breadcrumbs
          items={[
            { label: "Parent page", href: "/" },
            { label: "Child page", href: "/child" },
            { label: "Child page or grandchild page" },
          ]}
          rightContent={
            <Button variant="outlined" size="small">
              Secondary
            </Button>
          }
        />
        <ContextHeader.Title
          title="Name"
          dropdownItems={[
            { label: "Person 1", onClick: () => console.log("Selected Person 1") },
            { label: "Person 2", onClick: () => console.log("Selected Person 2") },
          ]}
          chip={<ColoredChip label="Territory" iconColor="info" />}
          actions={
            <>
              <Button variant="outlined" size="small" color="secondary">
                Cancel
              </Button>
              <Button variant="contained" size="small" color="primaryDark">
                Save Changes
              </Button>
              <IconButton size="small">
                <MoreVertIcon />
              </IconButton>
            </>
          }
        />
        <ContextHeader.Content>
          <Typography variant="body2">
            4992 Ridgefield Drive, Charlotte, NC 28105 | 515-705-9341 | elena.flores31@gmail.com
          </Typography>
        </ContextHeader.Content>
        <ContextHeader.Tabs
          value={tab}
          onChange={(_, val) => setTab(val)}
          rightContent={
            <Typography variant="caption">
              Created: Feb 21, 2025 | Last updated: Feb 24, 2025
            </Typography>
          }
        >
          <Tab label="Overview" value="overview" />
          <Tab label="Arrangements" value="arrangements" />
          <Tab label="Documents" value="documents" />
          <Tab label="Notes and History" value="notes" />
        </ContextHeader.Tabs>
      </ContextHeader>
    );
  },
};
