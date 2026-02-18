import { AccordionProps } from '@mui/material';
import { StepItem } from './Steps/Steps';
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
export interface StepNavProps {
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
 * Step navigation component with vertical steps organized into accordion groups.
 */
export declare const StepNav: ({ title, stepGroups, activeStep, onStepClick, sx }: StepNavProps) => import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=StepNav.d.ts.map