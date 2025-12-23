import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ReactNode } from "react";

export interface LabelAccordionProps {
  /**
   * Accordion label/title
   */
  label: string;
  /**
   * Content to display when expanded
   */
  children: ReactNode;
  /**
   * Whether the accordion is expanded by default
   */
  defaultExpanded?: boolean;
  /**
   * Controlled expanded state
   */
  expanded?: boolean;
  /**
   * Callback when expansion changes
   */
  onChange?: (expanded: boolean) => void;
}

/**
 * Labeled accordion component for collapsible sections
 * @component
 * @example
 * <LabelAccordion label="Personal Information">
 *   <p>Form fields go here</p>
 * </LabelAccordion>
 */
export const LabelAccordion = ({
  label,
  children,
  defaultExpanded,
  expanded,
  onChange,
}: LabelAccordionProps) => {
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      expanded={expanded}
      onChange={(_, isExpanded) => onChange?.(isExpanded)}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">{label}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box>{children}</Box>
      </AccordionDetails>
    </Accordion>
  );
};
