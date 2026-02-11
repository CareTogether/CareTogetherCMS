import React, { useId, useState, cloneElement, ReactElement } from "react";
import { Popover, PopoverProps } from "@mui/material";

type AccessiblePopoverBaseProps = Pick<PopoverProps, "sx" | "className">;

export interface AccessiblePopoverProps extends AccessiblePopoverBaseProps {
  /** The trigger element that will show the popover on hover */
  children: ReactElement;
  /** The content to display in the popover */
  popoverContent: React.ReactNode;
  /** Additional props to pass to the Popover component */
  popoverProps?: Partial<PopoverProps>;
  /**
   * Whether to disable the popover functionality
   * @default false
   */
  disabled?: boolean;
  /**
   * The anchor origin for the popover
   * @default { vertical: 'bottom', horizontal: 'left' }
   */
  anchorOrigin?: PopoverProps["anchorOrigin"];
  /**
   * The transform origin for the popover
   * @default { vertical: -8, horizontal: 'left' }
   */
  transformOrigin?: PopoverProps["transformOrigin"];
}

/**
 * AccessiblePopover component that wraps a child element with hover-based popover functionality
 *
 * The popover appears when the user hovers over the child element and automatically
 * includes proper ARIA attributes for accessibility. The popover has pointer-events disabled
 * to prevent interference with mouse interactions.
 */
export function AccessiblePopover({
  children,
  popoverContent,
  popoverProps = {},
  disabled = false,
  anchorOrigin = {
    vertical: "bottom",
    horizontal: "left",
  },
  transformOrigin = {
    vertical: -8,
    horizontal: "left",
  },
  sx,
  className,
}: AccessiblePopoverProps) {
  const reactId = useId();
  const id = `accessible-popover-${reactId}`;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl) && !disabled;

  // Clone the child element and add the necessary props
  const childProps = {
    "aria-describedby": disabled ? undefined : id,
    onMouseEnter: handlePopoverOpen,
    onMouseLeave: handlePopoverClose,
  };

  const enhancedChild = cloneElement(children, childProps);

  if (disabled) {
    return children;
  }

  return (
    <>
      {enhancedChild}
      <Popover
        id={id}
        sx={{ pointerEvents: "none", ...sx }}
        className={className}
        open={open}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        elevation={3}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
        disableRestoreFocus
        {...popoverProps}
      >
        {popoverContent}
      </Popover>
    </>
  );
}
