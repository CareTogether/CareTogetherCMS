/**
 * Context type for the Dropdown component
 */
export interface DropdownContextType {
    /** Whether the dropdown menu is open */
    open: boolean;
    /** Function to set the open state of the dropdown */
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    /** The anchor element for the dropdown menu */
    anchorEl: HTMLElement | null;
    /** Function to set the anchor element */
    setAnchorEl: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
    /** ID for the button element (for accessibility) */
    buttonId: string;
    /** ID for the menu element (for accessibility) */
    menuId: string;
}
export declare const DropdownContext: import('react').Context<DropdownContextType | undefined>;
/**
 * Hook to access the Dropdown context
 *
 * Must be used within a Dropdown component
 *
 * @throws {Error} If used outside of a Dropdown component
 * @returns The dropdown context containing state and control functions
 */
export declare const useDropdown: () => DropdownContextType;
//# sourceMappingURL=useDropdown.d.ts.map