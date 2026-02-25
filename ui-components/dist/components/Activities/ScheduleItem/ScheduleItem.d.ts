import { BoxProps } from '@mui/material';
import { ReactElement } from 'react';
type ScheduleItemBaseProps = Pick<BoxProps, "sx" | "className">;
export interface ScheduleItemOwnProps {
    /**
     * The text label to display
     */
    label: string;
    /**
     * Color of the left indicator bar (theme color key or hex)
     */
    color: string;
    /**
     * Optional component to render as (e.g., React Router Link, button, 'a', etc.)
     * When not provided, renders as a static Box
     */
    component?: React.ElementType;
    /**
     * Size variant
     * @default "medium"
     */
    size?: "small" | "medium" | "large";
    /**
     * Optional icon or start content
     */
    startIcon?: ReactElement;
    /**
     * Accessible label for screen readers when used as interactive element
     */
    "aria-label"?: string;
}
export type ScheduleItemProps<C extends React.ElementType = "div"> = ScheduleItemOwnProps & ScheduleItemBaseProps & Omit<React.ComponentPropsWithoutRef<C>, keyof ScheduleItemOwnProps | keyof ScheduleItemBaseProps>;
/**
 * A flexible display component for showing schedule items with a colored
 * indicator bar and label. Can be rendered as a link, button, or static display.
 */
export declare const ScheduleItem: <C extends React.ElementType = "div">({ label, color, component, size, startIcon, sx, className, ...rest }: ScheduleItemProps<C>) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ScheduleItem.d.ts.map