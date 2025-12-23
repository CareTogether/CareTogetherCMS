import { Box, Paper } from "@mui/material";
import { Steps, StepItem } from "./Steps/Steps.tsx";
import { LabelAccordion } from "./LabelAccordion/LabelAccordion.tsx";
import { ReactNode } from "react";

export interface IntakeStepNavProps {
  /**
   * Array of step items for the stepper
   */
  steps: StepItem[];
  /**
   * Current active step index
   */
  activeStep: number;
  /**
   * Whether to show accordions for each step
   */
  showAccordions?: boolean;
  /**
   * Content for each step (array of ReactNodes matching steps length)
   */
  stepContent?: ReactNode[];
  /**
   * Callback when a step is clicked
   */
  onStepClick?: (stepIndex: number) => void;
}

/**
 * Complete intake navigation component combining steps and accordions
 * @component
 * @example
 * <IntakeStepNav 
 *   steps={[{label: "Info"}, {label: "Review"}]} 
 *   activeStep={0}
 *   showAccordions={true}
 *   stepContent={[<Form />, <Review />]}
 * />
 */
export const IntakeStepNav = ({
  steps,
  activeStep,
  showAccordions = false,
  stepContent,
  onStepClick,
}: IntakeStepNavProps) => {
  return (
    <Box sx={{ width: "100%" }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Steps steps={steps} activeStep={activeStep} onStepClick={onStepClick} />
      </Paper>

      {showAccordions && stepContent && (
        <Box sx={{ mt: 3 }}>
          {steps.map((step, index) => (
            <LabelAccordion
              key={index}
              label={step.label}
              defaultExpanded={index === activeStep}
            >
              {stepContent[index] || (
                <Box sx={{ p: 2 }}>
                  {/* TODO: Implement step content for {step.label} */}
                  Content for {step.label}
                </Box>
              )}
            </LabelAccordion>
          ))}
        </Box>
      )}

      {!showAccordions && stepContent && (
        <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
          {stepContent[activeStep] || (
            <Box>
              {/* TODO: Implement step content */}
              Current step content
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};
