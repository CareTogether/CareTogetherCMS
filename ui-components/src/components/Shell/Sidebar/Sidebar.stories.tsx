import type { Meta, StoryObj } from "npm:@storybook/react@^8.0.0";
import { Sidebar } from "./Sidebar.tsx";

const meta: Meta<typeof Sidebar> = {
  title: "Shell/Sidebar",
  component: Sidebar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Open: Story = {
  args: {
    open: true,
    width: 240,
  },
};

export const Closed: Story = {
  args: {
    open: false,
  },
};

export const Wide: Story = {
  args: {
    open: true,
    width: 320,
  },
};

export const Narrow: Story = {
  args: {
    open: true,
    width: 180,
  },
};
