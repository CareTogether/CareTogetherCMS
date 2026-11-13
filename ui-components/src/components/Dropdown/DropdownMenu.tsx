import React from "react";
import Menu, { MenuProps } from "@mui/material/Menu";
import { useDropdown } from "./useDropdown";

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
 * Map placement values to MUI anchorOrigin and transformOrigin
 */
const getPositionProps = (placement?: DropdownMenuProps["placement"]) => {
  switch (placement) {
    case "bottom-end":
      return {
        anchorOrigin: { horizontal: "right" as const, vertical: "bottom" as const },
        transformOrigin: { horizontal: "right" as const, vertical: "top" as const },
      };
    case "bottom-start":
      return {
        anchorOrigin: { horizontal: "left" as const, vertical: "bottom" as const },
        transformOrigin: { horizontal: "left" as const, vertical: "top" as const },
      };
    case "top-end":
      return {
        anchorOrigin: { horizontal: "right" as const, vertical: "top" as const },
        transformOrigin: { horizontal: "right" as const, vertical: "bottom" as const },
      };
    case "top-start":
      return {
        anchorOrigin: { horizontal: "left" as const, vertical: "top" as const },
        transformOrigin: { horizontal: "left" as const, vertical: "bottom" as const },
      };
    case "top":
      return {
        anchorOrigin: { horizontal: "center" as const, vertical: "top" as const },
        transformOrigin: { horizontal: "center" as const, vertical: "bottom" as const },
      };
    case "bottom":
    default:
      return {
        anchorOrigin: { horizontal: "center" as const, vertical: "bottom" as const },
        transformOrigin: { horizontal: "center" as const, vertical: "top" as const },
      };
  }
};

/**
 * DropdownMenu component that displays a menu anchored to the dropdown trigger button
 *
 * Must be used within a Dropdown component. Automatically connects to the Dropdown
 * context to handle open state, positioning, and accessibility attributes.
 */
export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  children,
  placement = "bottom",
  onClose: onCloseProp,
  closeOnItemClick = false,
  sx,
  className,
}) => {
  const { open, setOpen, anchorEl, menuId, buttonId } = useDropdown();

  const handleClose = (event: object, reason: "backdropClick" | "escapeKeyDown") => {
    setOpen(false);

    if (onCloseProp) {
      onCloseProp(event, reason);
    }
  };

  const handleMenuItemClick = () => {
    if (closeOnItemClick) {
      setOpen(false);
    }
  };

  const positionProps = getPositionProps(placement);

  return (
    <Menu
      component="div"
      id={menuId}
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      onClick={handleMenuItemClick}
      slotProps={{
        list: {
          "aria-labelledby": buttonId,
        },
      }}
      sx={sx}
      className={className}
      {...positionProps}
    >
      {children}
    </Menu>
  );
};
