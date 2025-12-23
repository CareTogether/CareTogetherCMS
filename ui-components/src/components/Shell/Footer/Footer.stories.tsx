import type { Meta, StoryObj } from "npm:@storybook/react@^8.0.0";
import { Footer } from "./Footer.tsx";

const meta: Meta<typeof Footer> = {
  title: "Shell/Footer",
  component: Footer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof Footer>;

export const Default: Story = {
  args: {},
};

export const WithVersion: Story = {
  args: {
    version: "1.0.0",
  },
};

export const CustomCopyright: Story = {
  args: {
    copyrightText: "© 2025 CareTogether CMS - All Rights Reserved",
    version: "2.1.0",
  },
};
