import { BoxProps } from '@mui/material';
import { ReactNode } from 'react';
/**
 * Individual step in the progress card component
 */
export interface ProgressCardStep {
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
 * Base props for ProgressCard component, inheriting selected MUI Box props
 */
type ProgressCardBaseProps = Pick<BoxProps, "sx" | "className">;
/**
 * Props for the ProgressCard component
 */
export interface ProgressCardProps extends ProgressCardBaseProps {
    /**
     * Optional header text displayed at the top
     */
    header?: string;
    /**
     * Array of progress steps
     */
    steps: ProgressCardStep[];
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
/**
 * ProgressCard component displays a vertical stepper with optional header and actions.
 * Shows step labels, descriptions, and completion status with checkmarks.
 */
export declare const ProgressCard: ({ header, steps, activeStep, actions, showCompletionCount, sx, className, }: ProgressCardProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ProgressCard.d.ts.map