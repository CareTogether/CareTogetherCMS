import { Stepper, Step, StepLabel, StepButton, Box } from "@mui/material";

export interface StepItem {
  label: string;
  completed?: boolean;
  optional?: boolean;
}

export interface StepsProps {
  /**
   * Array of step items
   */
  steps: StepItem[];
  /**
   * Current active step index (0-based)
   */
  activeStep: number;
  /**
   * Callback when a step is clicked
   */
  onStepClick?: (stepIndex: number) => void;
  /**
   * Orientation of the stepper
   */
  orientation?: "horizontal" | "vertical";
}

/**
 * Step indicator component for multi-step forms/workflows
 * @component
 * @example
 * <Steps 
 *   steps={[{label: "Step 1"}, {label: "Step 2"}]} 
 *   activeStep={0}
 * />
 */
export const Steps = ({
  steps,
  activeStep,
  onStepClick,
  orientation = "horizontal",
}: StepsProps) => {
  return (
    <Box sx={{ width: "100%" }}>
      <Stepper activeStep={activeStep} orientation={orientation}>
        {steps.map((step, index) => (
          <Step key={index} completed={step.completed}>
            {onStepClick ? (
              <StepButton onClick={() => onStepClick(index)}>
                {step.label}
                {step.optional && " (Optional)"}
              </StepButton>
            ) : (
              <StepLabel optional={step.optional ? "Optional" : undefined}>
                {step.label}
              </StepLabel>
            )}
          </Step>
        ))}
      </Stepper>
      {/* TODO: Add step content area */}
    </Box>
  );
};
