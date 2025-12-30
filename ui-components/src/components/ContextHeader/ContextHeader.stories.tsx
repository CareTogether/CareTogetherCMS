import type { Meta, StoryObj } from "@storybook/react";
import { ContextHeader } from "./ContextHeader";

const meta: Meta<typeof ContextHeader> = {
  title: "Context/ContextHeader",
  component: ContextHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ContextHeader>;

export const Simple: Story = {
  args: {
    title: "Dashboard",
  },
};

export const WithSubtitle: Story = {
  args: {
    title: "Family Management",
    subtitle: "View and manage family information",
  },
};

export const WithBreadcrumbs: Story = {
  args: {
    title: "Smith Family",
    subtitle: "Active since January 2024",
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: "Families", href: "/families" },
      { label: "Smith Family" },
    ],
  },
};

export const Complex: Story = {
  args: {
    title: "Volunteer Application",
    subtitle: "John Doe - Application #12345",
    breadcrumbs: [
      { label: "Dashboard", href: "/" },
      { label: "Volunteers", href: "/volunteers" },
      { label: "Applications", href: "/volunteers/applications" },
      { label: "John Doe" },
    ],
  },
};
