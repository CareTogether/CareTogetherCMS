import { default as React } from 'react';
import { MenuProps } from '@mui/material/Menu';
type DropdownMenuBaseProps = Pick<MenuProps, "sx" | "className">;
export interface DropdownMenuProps extends DropdownMenuBaseProps {
    /** The content to render inside the menu (typically MenuItem components) */
    children: React.ReactNode;
    /**
     * The placement of the menu relative to the anchor element
     * @default 'bottom'
     */
    placement?: "bottom-end" | "bottom-start" | "bottom" | "top-end" | "top-start" | "top";
    /**
     * Whether to close the menu when any menu item is clicked
     * @default false
     */
    closeOnItemClick?: boolean;
    /** Callback fired when the menu is closed */
    onClose?: MenuProps["onClose"];
}
/**
 * DropdownMenu component that displays a menu anchored to the dropdown trigger button
 *
 * Must be used within a Dropdown component. Automatically connects to the Dropdown
 * context to handle open state, positioning, and accessibility attributes.
 */
export declare const DropdownMenu: React.FC<DropdownMenuProps>;
export {};
//# sourceMappingURL=DropdownMenu.d.ts.map