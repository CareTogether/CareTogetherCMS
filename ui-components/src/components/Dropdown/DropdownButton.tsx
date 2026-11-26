import React from "react";
import Button, { ButtonProps } from "@mui/material/Button";
import { useDropdown } from "./useDropdown";

type DropdownButtonBaseProps = Pick<
  ButtonProps,
  "sx" | "className" | "variant" | "color" | "size" | "disabled" | "startIcon" | "endIcon"
>;

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
export const DropdownButton: React.FC<DropdownButtonProps> = ({ children, onClick, ...props }) => {
  const { setOpen, setAnchorEl, open, buttonId, menuId } = useDropdown();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setOpen(!open);

    if (onClick) {
      onClick(event);
    }
  };

  return (
    <Button
      id={buttonId}
      aria-controls={open ? menuId : undefined}
      aria-haspopup="true"
      aria-expanded={open ? "true" : undefined}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
};
