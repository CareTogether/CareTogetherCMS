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
     * Global step offset for numbering
     */
    stepOffset?: number;
}
/**
 * Step indicator component for multi-step forms/workflows.
 */
export declare const Steps: ({ steps, activeStep, onStepClick, stepOffset }: StepsProps) => import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Steps.d.ts.map