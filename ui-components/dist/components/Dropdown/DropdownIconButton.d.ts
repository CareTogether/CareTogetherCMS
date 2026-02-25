import { default as React } from 'react';
import { IconButtonProps } from '@mui/material/IconButton';
type DropdownIconButtonBaseProps = Pick<IconButtonProps, "sx" | "className" | "color" | "size" | "disabled" | "edge">;
export interface DropdownIconButtonProps extends DropdownIconButtonBaseProps {
    /** The icon to render inside the button */
    children: React.ReactNode;
    /** Optional click handler (called before toggling the dropdown) */
    onClick?: IconButtonProps["onClick"];
}
/**
 * DropdownIconButton component that triggers the dropdown menu when clicked
 *
 * Must be used within a Dropdown component. Similar to DropdownButton but
 * renders as an icon button without text. Automatically handles aria attributes
 * for accessibility and toggles the dropdown menu state.
 */
export declare const DropdownIconButton: React.FC<DropdownIconButtonProps>;
export {};
//# sourceMappingURL=DropdownIconButton.d.ts.map