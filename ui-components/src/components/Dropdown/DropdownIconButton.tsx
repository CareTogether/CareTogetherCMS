import React from "react";
import IconButton, { IconButtonProps } from "@mui/material/IconButton";
import { useDropdown } from "./useDropdown";

type DropdownIconButtonBaseProps = Pick<
  IconButtonProps,
  "sx" | "className" | "color" | "size" | "disabled" | "edge"
>;

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
export const DropdownIconButton: React.FC<DropdownIconButtonProps> = ({
  children,
  onClick,
  ...props
}) => {
  const { setOpen, setAnchorEl, open, buttonId, menuId } = useDropdown();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setOpen(!open);

    if (onClick) {
      onClick(event);
    }
  };

  return (
    <IconButton
      id={buttonId}
      aria-controls={open ? menuId : undefined}
      aria-haspopup="true"
      aria-expanded={open ? "true" : undefined}
      onClick={handleClick}
      {...props}
    >
      {children}
    </IconButton>
  );
};
