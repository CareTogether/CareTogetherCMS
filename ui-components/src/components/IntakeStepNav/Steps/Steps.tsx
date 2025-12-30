import {
  Stepper,
  Step,
  StepLabel,
  StepButton,
  Box,
  StepIconProps,
  StepConnector,
  stepConnectorClasses,
  styled,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { useTheme } from "@mui/material/styles";

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
  /**
   * Global step offset for numbering
   */
  stepOffset?: number;
}

const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.dark,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.dark,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.divider,
    borderLeftWidth: 2,
    minHeight: 24,
  },
}));

/**
 * Custom step icon that shows numbers for steps and checkmarks for completed steps
 */
const CustomStepIcon = (props: StepIconProps) => {
  const { active, completed, icon } = props;
  const theme = useTheme();
  return (
    <Box
      sx={{
        width: 24,
        height: 24,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor:
          active || completed ? theme.palette.primary.main : theme.palette.background.paper,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor:
          active || completed ? theme.palette.primary.main : theme.palette.action.disabled,
        color: active || completed ? theme.palette.background.default : theme.palette.text.primary,
        fontSize: "0.75rem",
      }}
    >
      {completed ? <CheckIcon /> : icon}
    </Box>
  );
};

/**
 * Step indicator component for multi-step forms/workflows.
 * Completed steps show checkmarks, active steps are highlighted in primary color.
 * @component
 * @example
 * <Steps
 *   steps={[
 *     {label: "Step 1", completed: true},
 *     {label: "Step 2"}
 *   ]}
 *   activeStep={1}
 *   orientation="vertical"
 * />
 */
export const Steps = ({
  steps,
  activeStep,
  onStepClick,
  orientation = "horizontal",
  stepOffset = 0,
}: StepsProps) => {
  const theme = useTheme();

  return (
    <Box sx={{ width: "100%" }}>
      <Stepper activeStep={activeStep} orientation={orientation} connector={<ColorlibConnector />}>
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isCompleted = step.completed || false;
          const globalStepNumber = stepOffset + index + 1;

          return (
            <Step key={index} completed={isCompleted}>
              {onStepClick ? (
                <StepButton
                  onClick={() => onStepClick(index)}
                  icon={
                    <CustomStepIcon
                      active={isActive}
                      completed={isCompleted}
                      icon={globalStepNumber}
                    />
                  }
                  sx={{
                    "& .MuiStepLabel-label": {
                      color: isCompleted
                        ? theme.palette.primary.dark
                        : isActive
                          ? theme.palette.primary.main
                          : theme.palette.text.primary,
                      fontWeight: isActive ? 600 : 400,
                    },
                  }}
                >
                  {step.label}
                  {step.optional && " (Optional)"}
                </StepButton>
              ) : (
                <StepLabel
                  slots={{ stepIcon: CustomStepIcon }}
                  optional={step.optional ? "Optional" : undefined}
                  sx={{
                    "& .MuiStepLabel-label": {
                      color: isCompleted
                        ? theme.palette.primary.dark
                        : isActive
                          ? theme.palette.primary.main
                          : theme.palette.text.primary,
                      fontWeight: isActive ? 600 : 400,
                    },
                  }}
                >
                  {step.label}
                </StepLabel>
              )}
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
};
