import type { Meta, StoryObj } from "npm:@storybook/react@^8.0.0";
import { LabelAccordion } from "./LabelAccordion.tsx";
import { Typography } from "@mui/material";

const meta: Meta<typeof LabelAccordion> = {
  title: "IntakeStepNav/LabelAccordion",
  component: LabelAccordion,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof LabelAccordion>;

export const Default: Story = {
  args: {
    label: "Personal Information",
    children: (
      <Typography>
        Form fields for personal information would go here.
      </Typography>
    ),
  },
};

export const Expanded: Story = {
  args: {
    label: "Contact Details",
    defaultExpanded: true,
    children: (
      <Typography>
        Email, phone, and address fields would be displayed here.
      </Typography>
    ),
  },
};

export const WithComplexContent: Story = {
  args: {
    label: "Emergency Contacts",
    children: (
      <div>
        <Typography variant="subtitle1" gutterBottom>
          Primary Contact
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Name: John Doe
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Phone: (555) 123-4567
        </Typography>
      </div>
    ),
  },
};
