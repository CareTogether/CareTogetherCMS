import { default as React } from 'react';
import { DropdownMenu } from './DropdownMenu';
import { DropdownButton } from './DropdownButton';
import { DropdownIconButton } from './DropdownIconButton';
export interface DropdownProps {
    /** The content to render inside the dropdown (typically Button and Menu) */
    children: React.ReactNode;
    /** Optional ID for the dropdown (used for accessibility) */
    id?: string;
    /** Controlled open state */
    open?: boolean;
    /** Controlled state setter for open */
    setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}
interface DropdownComposition {
    Menu: typeof DropdownMenu;
    Button: typeof DropdownButton;
    IconButton: typeof DropdownIconButton;
}
/**
 * Dropdown component that provides context for dropdown menu interactions
 *
 * Supports both controlled and uncontrolled modes. In uncontrolled mode, manages its own
 * open state. In controlled mode, the parent component controls the open state via the
 * open and setOpen props.
 */
export declare const Dropdown: React.FC<DropdownProps> & DropdownComposition;
export {};
//# sourceMappingURL=Dropdown.d.ts.map