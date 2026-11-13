import React, { useId, useState, useCallback } from "react";
import { DropdownContext } from "./useDropdown";
import { DropdownMenu } from "./DropdownMenu";
import { DropdownButton } from "./DropdownButton";
import { DropdownIconButton } from "./DropdownIconButton";

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
export const Dropdown: React.FC<DropdownProps> & DropdownComposition = ({
  children,
  id,
  open,
  setOpen,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const isControlled = open !== undefined && setOpen !== undefined;

  const isOpen = isControlled ? open : internalOpen;

  const handleSetOpen = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      if (isControlled && setOpen) {
        setOpen(value);
      } else {
        setInternalOpen(value);
      }
    },
    [isControlled, setOpen]
  );

  // Generate unique IDs for accessibility connections
  const reactId = useId();
  const dropdownId = id ?? `dropdown-${reactId}`;
  const buttonId = `${dropdownId}-button`;
  const menuId = `${dropdownId}-menu`;

  return (
    <DropdownContext.Provider
      value={{
        open: isOpen,
        setOpen: handleSetOpen,
        anchorEl,
        setAnchorEl,
        buttonId,
        menuId,
      }}
    >
      {children}
    </DropdownContext.Provider>
  );
};

Dropdown.Menu = DropdownMenu;
Dropdown.Button = DropdownButton;
Dropdown.IconButton = DropdownIconButton;
