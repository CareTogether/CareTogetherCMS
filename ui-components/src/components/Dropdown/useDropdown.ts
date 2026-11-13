import { createContext, useContext } from "react";

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

export const DropdownContext = createContext<DropdownContextType | undefined>(undefined);

/**
 * Hook to access the Dropdown context
 *
 * Must be used within a Dropdown component
 *
 * @throws {Error} If used outside of a Dropdown component
 * @returns The dropdown context containing state and control functions
 */
export const useDropdown = () => {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("useDropdown must be used within a Dropdown component");
  }
  return context;
};
