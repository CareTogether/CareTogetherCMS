import type { Meta, StoryObj } from "npm:@storybook/react@^8.0.0";
import { Steps } from "./Steps.tsx";

const meta: Meta<typeof Steps> = {
  title: "IntakeStepNav/Steps",
  component: Steps,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Steps>;

const defaultSteps = [
  { label: "Personal Information" },
  { label: "Contact Details" },
  { label: "Review & Submit" },
];

export const FirstStep: Story = {
  args: {
    steps: defaultSteps,
    activeStep: 0,
  },
};

export const SecondStep: Story = {
  args: {
    steps: defaultSteps,
    activeStep: 1,
  },
};

export const LastStep: Story = {
  args: {
    steps: defaultSteps,
    activeStep: 2,
  },
};

export const WithCompleted: Story = {
  args: {
    steps: [
      { label: "Personal Information", completed: true },
      { label: "Contact Details", completed: true },
      { label: "Review & Submit" },
    ],
    activeStep: 2,
  },
};

export const WithOptional: Story = {
  args: {
    steps: [
      { label: "Required Info" },
      { label: "Optional Info", optional: true },
      { label: "Submit" },
    ],
    activeStep: 1,
  },
};

export const Vertical: Story = {
  args: {
    steps: defaultSteps,
    activeStep: 1,
    orientation: "vertical",
  },
};

export const Interactive: Story = {
  args: {
    steps: [
      { label: "Step 1", completed: true },
      { label: "Step 2", completed: true },
      { label: "Step 3" },
      { label: "Step 4" },
    ],
    activeStep: 2,
    onStepClick: (index: number) => console.log(`Clicked step ${index}`),
  },
};
