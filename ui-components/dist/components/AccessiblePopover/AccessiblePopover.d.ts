import { default as React, ReactElement } from 'react';
import { PopoverProps } from '@mui/material';
type AccessiblePopoverBaseProps = Pick<PopoverProps, "sx" | "className">;
export interface AccessiblePopoverProps extends AccessiblePopoverBaseProps {
    /** The trigger element that will show the popover on hover */
    children: ReactElement;
    /** The content to display in the popover */
    popoverContent: React.ReactNode;
    /** Additional props to pass to the Popover component */
    popoverProps?: Partial<PopoverProps>;
    /**
     * Whether to disable the popover functionality
     * @default false
     */
    disabled?: boolean;
    /**
     * The anchor origin for the popover
     * @default { vertical: 'bottom', horizontal: 'left' }
     */
    anchorOrigin?: PopoverProps["anchorOrigin"];
    /**
     * The transform origin for the popover
     * @default { vertical: -8, horizontal: 'left' }
     */
    transformOrigin?: PopoverProps["transformOrigin"];
}
/**
 * AccessiblePopover component that wraps a child element with hover-based popover functionality
 *
 * The popover appears when the user hovers over the child element and automatically
 * includes proper ARIA attributes for accessibility. The popover has pointer-events disabled
 * to prevent interference with mouse interactions.
 */
export declare function AccessiblePopover({ children, popoverContent, popoverProps, disabled, anchorOrigin, transformOrigin, sx, className, }: AccessiblePopoverProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=AccessiblePopover.d.ts.map