import type { Meta, StoryObj } from "@storybook/react-vite";
import { StepNav } from "./StepNav";
import { Box } from "@mui/material";

const meta: Meta<typeof StepNav> = {
  title: "Components/Navigation/StepNav",
  component: StepNav,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof StepNav>;

export const SingleGroup: Story = {
  args: {
    title: "Application Process",
    stepGroups: [
      {
        label: "Application Steps",
        steps: [
          { label: "Personal Information" },
          { label: "Contact Details" },
          { label: "Review & Submit" },
        ],
      },
    ],
    activeStep: 0,
  },
};

export const MultipleGroups: Story = {
  args: {
    title: "Volunteer Onboarding",
    stepGroups: [
      {
        label: "Basic Information",
        steps: [
          { label: "Personal Information", completed: true },
          { label: "Contact Details", completed: true },
        ],
      },
      {
        label: "Background Check",
        steps: [
          { label: "Criminal History", completed: true },
          { label: "Reference Check", completed: false },
          { label: "Interview", completed: false },
        ],
      },
      {
        label: "Training & Finalization",
        steps: [
          { label: "Safety Training" },
          { label: "Policy Review" },
          { label: "Final Approval" },
        ],
      },
    ],
    activeStep: 3,
  },
};

export const WithClickHandler: Story = {
  args: {
    title: "Family Intake",
    stepGroups: [
      {
        label: "Household Information",
        steps: [
          { label: "Household Details", completed: true },
          { label: "Family Members", completed: false },
        ],
      },
      {
        label: "Needs Assessment",
        steps: [{ label: "Current Situation" }, { label: "Support Needs" }, { label: "Goals" }],
      },
      {
        label: "Documentation",
        steps: [{ label: "Upload Documents" }, { label: "Review & Submit" }],
      },
    ],
    activeStep: 1,
    onStepClick: (index) => alert(`Clicked step ${index + 1}`),
  },
};

export const AllCompleted: Story = {
  args: {
    title: "Complete Application",
    stepGroups: [
      {
        label: "Phase 1",
        steps: [
          { label: "Personal Information", completed: true },
          { label: "Contact Details", completed: true },
        ],
      },
      {
        label: "Phase 2",
        steps: [
          { label: "References", completed: true },
          { label: "Documentation", completed: true },
        ],
      },
    ],
    activeStep: 3,
  },
};

export const WithCustomExpansion: Story = {
  args: {
    title: "Controlled Expansion",
    stepGroups: [
      {
        label: "Completed Section",
        steps: [
          { label: "Step 1", completed: true },
          { label: "Step 2", completed: true },
        ],
        defaultExpanded: false,
      },
      {
        label: "Current Section",
        steps: [{ label: "Step 3", completed: false }, { label: "Step 4" }],
        defaultExpanded: true,
      },
      {
        label: "Future Section",
        steps: [{ label: "Step 5" }, { label: "Step 6" }],
        defaultExpanded: false,
      },
    ],
    activeStep: 2,
  },
};

export const InContainer: Story = {
  render: (args) => (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 3 }}>
      <StepNav {...args} />
    </Box>
  ),
  args: {
    title: "Volunteer Application",
    stepGroups: [
      {
        label: "Initial Steps",
        steps: [
          { label: "Personal Info", completed: true },
          { label: "Availability", completed: false },
        ],
      },
      {
        label: "Final Steps",
        steps: [{ label: "Skills & Interests" }, { label: "Submit" }],
      },
    ],
    activeStep: 1,
  },
};
