import type { Meta, StoryObj } from "@storybook/react-vite";
import { ExpandableText } from "./ExpandableText";
import { Box } from "@mui/material";

const meta: Meta<typeof ExpandableText> = {
  title: "Components/Display/ExpandableText",
  component: ExpandableText,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["body1", "body2", "caption", "h6"],
    },
    color: {
      control: "select",
      options: ["text.primary", "text.secondary", "primary.main", "error.main"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ExpandableText>;

const shortText = "This is a short text that does not overflow.";

const mediumText =
  "This is a medium length text that may or may not overflow depending on the line limit. It contains enough content to demonstrate the truncation behavior when set to a low number of lines.";

const longText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.`;

export const ShortText: Story = {
  args: {
    text: shortText,
    length: 150,
  },
  decorators: [
    (Story: React.ComponentType) => (
      <Box sx={{ maxWidth: 600 }}>
        <Story />
      </Box>
    ),
  ],
};

export const LongTextDefault: Story = {
  args: {
    text: longText,
    length: 150,
  },
  decorators: [
    (Story: React.ComponentType) => (
      <Box sx={{ maxWidth: 600 }}>
        <Story />
      </Box>
    ),
  ],
};

export const ShortLength: Story = {
  args: {
    text: mediumText,
    length: 50,
  },
  decorators: [
    (Story: React.ComponentType) => (
      <Box sx={{ maxWidth: 600 }}>
        <Story />
      </Box>
    ),
  ],
};

export const LongLength: Story = {
  args: {
    text: longText,
    length: 300,
  },
  decorators: [
    (Story: React.ComponentType) => (
      <Box sx={{ maxWidth: 600 }}>
        <Story />
      </Box>
    ),
  ],
};

export const CustomOmission: Story = {
  args: {
    text: longText,
    length: 150,
    omission: " [...]",
  },
  decorators: [
    (Story: React.ComponentType) => (
      <Box sx={{ maxWidth: 600 }}>
        <Story />
      </Box>
    ),
  ],
};

export const WithSeparator: Story = {
  args: {
    text: longText,
    length: 150,
    separator: " ",
  },
  decorators: [
    (Story: React.ComponentType) => (
      <Box sx={{ maxWidth: 600 }}>
        <Story />
      </Box>
    ),
  ],
};

export const CustomButtonText: Story = {
  args: {
    text: longText,
    length: 150,
    expandText: "Read more",
    collapseText: "Read less",
  },
  decorators: [
    (Story: React.ComponentType) => (
      <Box sx={{ maxWidth: 600 }}>
        <Story />
      </Box>
    ),
  ],
};

export const Body2Variant: Story = {
  args: {
    text: longText,
    length: 150,
    variant: "body2",
  },
  decorators: [
    (Story: React.ComponentType) => (
      <Box sx={{ maxWidth: 600 }}>
        <Story />
      </Box>
    ),
  ],
};

export const SecondaryColor: Story = {
  args: {
    text: longText,
    length: 150,
    variant: "body2",
    color: "text.secondary",
  },
  decorators: [
    (Story: React.ComponentType) => (
      <Box sx={{ maxWidth: 600 }}>
        <Story />
      </Box>
    ),
  ],
};

export const Caption: Story = {
  args: {
    text: longText,
    length: 200,
    variant: "caption",
    color: "text.secondary",
  },
  decorators: [
    (Story: React.ComponentType) => (
      <Box sx={{ maxWidth: 600 }}>
        <Story />
      </Box>
    ),
  ],
};

export const NarrowContainer: Story = {
  args: {
    text: mediumText,
    length: 80,
  },
  decorators: [
    (Story: React.ComponentType) => (
      <Box sx={{ maxWidth: 300 }}>
        <Story />
      </Box>
    ),
  ],
};

export const EmptyText: Story = {
  args: {
    text: "",
    length: 150,
  },
  decorators: [
    (Story: React.ComponentType) => (
      <Box sx={{ maxWidth: 600 }}>
        <Story />
      </Box>
    ),
  ],
};
