import {
  Box,
  BoxProps,
  Card,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  stepConnectorClasses,
  styled,
  Typography,
  StepIconProps,
  Theme,
  StepContent,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { ReactNode } from "react";

/**
 * Individual step in the progress component
 */
export interface ProgressStep {
  /**
   * Label/header for the step
   */
  label: string;
  /**
   * Optional description text below the label
   */
  description?: string;
  /**
   * Whether this step is completed
   */
  completed?: boolean;
}

/**
 * Base props for Progress component, inheriting selected MUI Box props
 */
type ProgressBaseProps = Pick<BoxProps, "sx" | "className">;

/**
 * Props for the Progress component
 */
export interface ProgressProps extends ProgressBaseProps {
  /**
   * Optional header text displayed at the top
   */
  header?: string;
  /**
   * Array of progress steps
   */
  steps: ProgressStep[];
  /**
   * Current active step index (0-based)
   */
  activeStep?: number;
  /**
   * Optional actions (buttons, etc.) to display below the steps
   */
  actions?: ReactNode;
  /**
   * Whether to show completion count in header
   * @default true
   */
  showCompletionCount?: boolean;
}

const ProgressConnector = styled(StepConnector)(({ theme }: { theme: Theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: "calc(-50% + 12px)",
    right: "calc(50% + 12px)",
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.divider,
    borderLeftWidth: 2,
    minHeight: 24,
  },
}));

/**
 * Custom step icon component that displays circles and checkmarks
 */
const ProgressStepIcon = (props: StepIconProps) => {
  const { active, completed } = props;

  return (
    <Box
      sx={{
        width: 24,
        height: 24,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: completed ? "primary.main" : "transparent",
        border: completed ? "none" : "2px solid",
        borderColor: active ? "primary.main" : "divider",
        color: completed ? "background.default" : "transparent",
        flexShrink: 0,
        marginLeft: "1px",
      }}
    >
      {completed && <CheckIcon sx={{ fontSize: 16 }} />}
    </Box>
  );
};

/**
 * Progress component displays a vertical stepper with optional header and actions.
 * Shows step labels, descriptions, and completion status with checkmarks.
 */
export const Progress = ({
  header,
  steps,
  activeStep = 0,
  actions,
  showCompletionCount = true,
  sx,
  className,
}: ProgressProps) => {
  const completedCount = steps.filter((step) => step.completed).length;
  const totalCount = steps.length;

  return (
    <Card
      elevation={0}
      sx={{
        p: 2,
        ...sx,
      }}
      className={className}
    >
      {/* Optional Header with completion count */}
      {header && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {header}
          </Typography>
          {showCompletionCount && (
            <Typography variant="body2" color="text.secondary">
              {completedCount} of {totalCount} completed
            </Typography>
          )}
        </Box>
      )}

      {/* Vertical Stepper */}
      <Stepper
        activeStep={activeStep}
        orientation="vertical"
        connector={<ProgressConnector />}
        sx={{
          "& .MuiStepContent-root": {
            borderWidth: "2px",
            borderColor: "divider",
            ml: "12px",
            pl: "23px",
          },
          "& .MuiStep-root": {
            pb: 0,
          },
        }}
      >
        {steps.map((step, index) => (
          <Step key={index} completed={step.completed}>
            <StepLabel
              slots={{ stepIcon: ProgressStepIcon }}
              sx={{
                alignItems: "flex-start",
                py: 0,
                "& .MuiStepLabel-iconContainer": {
                  pt: 0.25,
                },
                "& .MuiStepLabel-labelContainer": {
                  ml: 0.5,
                },
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 500,
                  pt: 0.5,
                  lineHeight: 1.3,
                }}
              >
                {step.label}
              </Typography>
            </StepLabel>
            {step.description && (
              <StepContent>
                <Typography variant="body2" sx={{ mt: 0.5, pr: 2 }}>
                  {step.description}
                </Typography>
              </StepContent>
            )}
          </Step>
        ))}
      </Stepper>

      {/* Optional Actions */}
      {actions && <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>{actions}</Box>}
    </Card>
  );
};
