import type { Meta, StoryObj } from "@storybook/react";
import { ProgressCard } from "./ProgressCard";
import { Button } from "@mui/material";

const meta: Meta<typeof ProgressCard> = {
  title: "Components/Feedback/ProgressCard",
  component: ProgressCard,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [(story) => <div style={{ maxWidth: 330 }}>{story()}</div>],
};

export default meta;
type Story = StoryObj<typeof ProgressCard>;

/**
 * Default progress component with header and completion count
 */
export const Default: Story = {
  args: {
    header: "Header",
    steps: [
      {
        label: "Lorem ipsum dolor sit amet",
        description: "Nibh pellentesque orci lorem odio in. Viverra nunc lectus odio pharetra.",
        completed: false,
      },
      {
        label: "Lorem ipsum dolor sit amet",
        description: "Nibh pellentesque orci lorem odio in. Viverra nunc lectus odio pharetra.",
        completed: false,
      },
      {
        label: "Lorem ipsum dolor sit amet",
        description: "Nibh pellentesque orci lorem odio in. Viverra nunc lectus odio pharetra.",
        completed: false,
      },
      {
        label: "Lorem ipsum dolor sit amet",
        description: "Nibh pellentesque orci lorem odio in. Viverra nunc lectus odio pharetra.",
        completed: false,
      },
      {
        label: "Lorem ipsum dolor sit amet",
        description: "Nibh pellentesque orci lorem odio in. Viverra nunc lectus odio pharetra.",
        completed: false,
      },
    ],
    activeStep: 0,
  },
};

/**
 * Progress with some completed steps
 */
export const WithCompletedSteps: Story = {
  args: {
    header: "Header",
    steps: [
      {
        label: "Lorem ipsum dolor sit amet consectetur",
        description: "Nibh pellentesque orci lorem odio in. Viverra nunc lectus odio pharetra.",
        completed: true,
      },
      {
        label: "Lorem ipsum dolor sit amet consectetur",
        description: "Nibh pellentesque orci lorem odio in. Viverra nunc lectus odio pharetra.",
        completed: true,
      },
      {
        label: "Lorem ipsum dolor sit amet consectetur",
        description: "Nibh pellentesque orci lorem odio in. Viverra nunc lectus odio pharetra.",
        completed: true,
      },
      {
        label: "Lorem ipsum dolor sit amet consectetur",
        description: "Nibh pellentesque orci lorem odio in. Viverra nunc lectus odio pharetra.",
        completed: false,
      },
      {
        label: "Lorem ipsum dolor sit amet consectetur",
        description: "Nibh pellentesque orci lorem odio in. Viverra nunc lectus odio pharetra.",
        completed: false,
      },
    ],
    activeStep: 3,
  },
};

/**
 * Progress with action button
 */
export const WithActions: Story = {
  args: {
    header: "Header",
    steps: [
      {
        label: "Lorem ipsum dolor sit amet consectetur",
        description: "Nibh pellentesque orci lorem odio in. Viverra nunc lectus odio pharetra.",
        completed: false,
      },
      {
        label: "Lorem ipsum dolor sit amet consectetur",
        description: "Nibh pellentesque orci lorem odio in. Viverra nunc lectus odio pharetra.",
        completed: false,
      },
      {
        label: "Lorem ipsum dolor sit amet consectetur",
        description: "Nibh pellentesque orci lorem odio in. Viverra nunc lectus odio pharetra.",
        completed: false,
      },
      {
        label: "Lorem ipsum dolor sit amet consectetur",
        description: "Nibh pellentesque orci lorem odio in. Viverra nunc lectus odio pharetra.",
        completed: false,
      },
      {
        label: "Lorem ipsum dolor sit amet consectetur",
        description: "Nibh pellentesque orci lorem odio in. Viverra nunc lectus odio pharetra.",
        completed: false,
      },
    ],
    activeStep: 0,
    actions: (
      <>
        <Button variant="outlined" color="secondary">
          Back
        </Button>
        <Button variant="contained" color="primaryDark">
          Continue
        </Button>
      </>
    ),
  },
};

/**
 * Progress without header
 */
export const WithoutHeader: Story = {
  args: {
    steps: [
      {
        label: "Create Account",
        description: "Set up your profile and credentials",
        completed: true,
      },
      {
        label: "Verify Email",
        description: "Check your inbox for verification link",
        completed: true,
      },
      {
        label: "Add Payment Method",
        description: "Enter your credit card information",
        completed: false,
      },
      {
        label: "Complete Profile",
        description: "Fill in additional details",
        completed: false,
      },
    ],
    activeStep: 2,
  },
};

/**
 * Progress without completion count
 */
export const WithoutCompletionCount: Story = {
  args: {
    header: "Onboarding Steps",
    showCompletionCount: false,
    steps: [
      {
        label: "Step 1",
        description: "Complete the first step",
        completed: true,
      },
      {
        label: "Step 2",
        description: "Complete the second step",
        completed: false,
      },
      {
        label: "Step 3",
        description: "Complete the third step",
        completed: false,
      },
    ],
    activeStep: 1,
  },
};

/**
 * Short step labels without descriptions
 */
export const ShortLabels: Story = {
  args: {
    header: "Quick Setup",
    steps: [
      { label: "Account Created", completed: true },
      { label: "Email Verified", completed: true },
      { label: "Profile Setup", completed: false },
      { label: "Preferences", completed: false },
    ],
    activeStep: 2,
  },
};

/**
 * All steps completed
 */
export const AllCompleted: Story = {
  args: {
    header: "Setup Complete",
    steps: [
      {
        label: "Account Setup",
        description: "Your account has been created",
        completed: true,
      },
      {
        label: "Email Verification",
        description: "Your email has been verified",
        completed: true,
      },
      {
        label: "Profile Completed",
        description: "Your profile is complete",
        completed: true,
      },
    ],
    activeStep: 3,
    actions: (
      <Button variant="contained" color="primary">
        Get Started
      </Button>
    ),
  },
};
