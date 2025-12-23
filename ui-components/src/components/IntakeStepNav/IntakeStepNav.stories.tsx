import type { Meta, StoryObj } from "npm:@storybook/react@^8.0.0";
import { IntakeStepNav } from "./IntakeStepNav.tsx";
import { Typography, TextField, Box } from "@mui/material";

const meta: Meta<typeof IntakeStepNav> = {
  title: "IntakeStepNav/IntakeStepNav",
  component: IntakeStepNav,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof IntakeStepNav>;

const steps = [
  { label: "Personal Information" },
  { label: "Contact Details" },
  { label: "Review & Submit" },
];

export const SimpleSteps: Story = {
  args: {
    steps,
    activeStep: 0,
  },
};

export const WithAccordions: Story = {
  args: {
    steps,
    activeStep: 1,
    showAccordions: true,
    stepContent: [
      <Typography key={0}>Personal information form would go here</Typography>,
      <Typography key={1}>Contact details form would go here</Typography>,
      <Typography key={2}>Review and submit section would go here</Typography>,
    ],
  },
};

export const WithFormContent: Story = {
  args: {
    steps,
    activeStep: 0,
    showAccordions: false,
    stepContent: [
      <Box key={0} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField label="First Name" variant="outlined" fullWidth />
        <TextField label="Last Name" variant="outlined" fullWidth />
        <TextField label="Date of Birth" type="date" variant="outlined" fullWidth InputLabelProps={{ shrink: true }} />
      </Box>,
      <Box key={1} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField label="Email" type="email" variant="outlined" fullWidth />
        <TextField label="Phone" variant="outlined" fullWidth />
        <TextField label="Address" variant="outlined" fullWidth multiline rows={3} />
      </Box>,
      <Box key={2}>
        <Typography variant="h6" gutterBottom>Review Your Information</Typography>
        <Typography variant="body2">Please review all information before submitting.</Typography>
      </Box>,
    ],
  },
};

export const PartiallyCompleted: Story = {
  args: {
    steps: [
      { label: "Personal Info", completed: true },
      { label: "Contact Details", completed: true },
      { label: "Review" },
    ],
    activeStep: 2,
    showAccordions: true,
    stepContent: [
      <Typography key={0}>✓ Personal information completed</Typography>,
      <Typography key={1}>✓ Contact details completed</Typography>,
      <Typography key={2}>Ready to submit</Typography>,
    ],
  },
};
