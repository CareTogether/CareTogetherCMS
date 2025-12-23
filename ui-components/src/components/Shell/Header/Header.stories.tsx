import type { Meta, StoryObj } from "npm:@storybook/react@^8.0.0";
import { Header } from "./Header.tsx";

const meta: Meta<typeof Header> = {
  title: "Shell/Header",
  component: Header,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {
  args: {
    title: "CareTogether CMS",
  },
};

export const WithSubtitle: Story = {
  args: {
    title: "CareTogether CMS",
    subtitle: "Family Management",
  },
};

export const CustomTitle: Story = {
  args: {
    title: "Dashboard",
    subtitle: "Overview",
  },
};
