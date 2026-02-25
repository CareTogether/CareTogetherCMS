import { default as React } from 'react';
import { ButtonProps } from '@mui/material/Button';
type DropdownButtonBaseProps = Pick<ButtonProps, "sx" | "className" | "variant" | "color" | "size" | "disabled" | "startIcon" | "endIcon">;
export interface DropdownButtonProps extends DropdownButtonBaseProps {
    /** The content to render inside the button */
    children: React.ReactNode;
    /** Optional click handler (called before toggling the dropdown) */
    onClick?: ButtonProps["onClick"];
}
/**
 * DropdownButton component that triggers the dropdown menu when clicked
 *
 * Must be used within a Dropdown component. Automatically handles aria attributes
 * for accessibility and toggles the dropdown menu state.
 */
export declare const DropdownButton: React.FC<DropdownButtonProps>;
export {};
//# sourceMappingURL=DropdownButton.d.ts.map