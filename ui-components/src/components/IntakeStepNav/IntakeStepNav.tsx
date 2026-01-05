import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  AccordionProps,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Steps, StepItem } from "./Steps/Steps";

export type { StepItem };

export interface StepGroup {
  /**
   * Label for this group of steps (displayed in accordion summary)
   */
  label?: string;
  /**
   * Steps in this group
   */
  steps: StepItem[];
  /**
   * Whether this accordion is expanded by default
   */
  defaultExpanded?: boolean;
  /**
   * Controlled expanded state for this accordion
   */
  expanded?: boolean;
  /**
   * Callback when this accordion's expansion changes
   */
  onExpansionChange?: (expanded: boolean) => void;
}

export interface IntakeStepNavProps {
  /**
   * Optional title displayed above the accordions (primary.dark color, weight 600, letter-spacing 0.15px)
   */
  title?: string;
  /**
   * Array of step groups, each rendered as its own accordion
   */
  stepGroups: StepGroup[];
  /**
   * Current active step index (global across all groups)
   */
  activeStep: number;
  /**
   * Callback when a step is clicked (receives global step index)
   */
  onStepClick?: (stepIndex: number) => void;
  /**
   * Additional MUI Box props
   */
  sx?: AccordionProps["sx"];
}

/**
 * Intake navigation component with vertical steps organized into accordion groups.
 */
export const IntakeStepNav = ({
  title,
  stepGroups,
  activeStep,
  onStepClick,
  sx,
}: IntakeStepNavProps) => {
  // Calculate global step indices and completion counts
  let globalStepOffset = 0;
  const groupsWithOffsets = stepGroups.map((group) => {
    const offset = globalStepOffset;
    const completedCount = group.steps.filter((step) => step.completed).length;
    const stepCount = group.steps.length;
    globalStepOffset += stepCount;
    return { ...group, offset, completedCount, stepCount };
  });

  return (
    <Box sx={{ width: "100%", ...sx }}>
      {title && (
        <Typography
          variant="h6"
          sx={{
            color: "primary.dark",
            fontWeight: 600,
            letterSpacing: "0.15px",
            mb: 2,
          }}
        >
          {title}
        </Typography>
      )}
      {groupsWithOffsets.map((group, groupIndex) => {
        // Determine if active step is in this group
        const localActiveStep = activeStep - group.offset;
        const isActiveInGroup = localActiveStep >= 0 && localActiveStep < group.stepCount;

        return (
          <Box key={groupIndex}>
            <Accordion
              defaultExpanded={group.defaultExpanded ?? true}
              expanded={group.expanded}
              onChange={(_, isExpanded) => group.onExpansionChange?.(isExpanded)}
              elevation={0}
              sx={{ backgroundColor: "transparent" }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  pl: 1,
                  py: 1,
                  "&.Mui-expanded": {
                    minHeight: "auto",
                  },
                  "& .MuiAccordionSummary-content": {
                    my: 0,
                  },
                  "& .MuiAccordionSummary-content.Mui-expanded": {
                    my: 0,
                  },
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight={500}
                  sx={{
                    color: isActiveInGroup ? "primary.dark" : "text.primary",
                  }}
                >
                  {group.label || `Steps ${group.offset + 1}-${group.offset + group.stepCount}`} (
                  {group.stepCount})
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0, px: 2, pt: 2, pb: 1 }}>
                <Steps
                  steps={group.steps}
                  activeStep={isActiveInGroup ? localActiveStep : -1}
                  onStepClick={
                    onStepClick ? (localIndex) => onStepClick(group.offset + localIndex) : undefined
                  }
                  orientation="vertical"
                  stepOffset={group.offset}
                />
              </AccordionDetails>
            </Accordion>
            {groupIndex < groupsWithOffsets.length - 1 && <Divider sx={{ my: 2 }} />}
          </Box>
        );
      })}
    </Box>
  );
};
