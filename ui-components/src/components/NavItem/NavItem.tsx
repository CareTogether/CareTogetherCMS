import { Box, BoxProps, Tooltip, Typography } from "@mui/material";
import { ElementType, ReactNode } from "react";

type NavItemBaseProps = Pick<BoxProps, "sx" | "className" | "component">;

export interface NavItemProps extends NavItemBaseProps {
  /**
   * Icon element to display
   */
  icon: ReactNode;
  /**
   * Text label for the navigation item
   */
  text: string;
  /**
   * Whether the nav item is in collapsed state (text hidden, tooltip shown)
   */
  collapsed?: boolean;
  /**
   * Optional click handler
   */
  onClick?: () => void;
  /**
   * The component used for the root node (default: "button")
   * Can be a string for HTML elements or a React component (e.g., Link from react-router)
   */
  component?: ElementType;
  /**
   * Additional props to pass to the underlying component
   */
  [key: string]: any;
}

/**
 * Navigation item component with icon and text
 * 
 * @component
 * @example
 * // As a button
 * <NavItem icon={<HomeIcon />} text="Dashboard" onClick={handleClick} />
 * 
 * @example
 * // As a router link
 * <NavItem 
 *   icon={<HomeIcon />} 
 *   text="Dashboard" 
 *   component={Link} 
 *   to="/dashboard" 
 * />
 * 
 * @example
 * // As a native link
 * <NavItem 
 *   icon={<HomeIcon />} 
 *   text="External" 
 *   component="a" 
 *   href="https://example.com" 
 *   target="_blank"
 * />
 */
export const NavItem = ({
  icon,
  text,
  collapsed = false,
  onClick,
  component = "button",
  sx,
  className,
  ...rest
}: NavItemProps) => {
  const content = (
    <Box
      component={component}
      onClick={onClick}
      className={className}
      {...rest}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: collapsed ? 0 : 1.5,
        px: collapsed ? 1.5 : 3,
        py: 2,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        width: "100%",
        textAlign: "left",
        justifyContent: collapsed ? "center" : "flex-start",
        textDecoration: "none",
        "& .navitem-icon": {
          color: "primary.dark",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "color 0.2s ease-in-out",
        },
        "& .navitem-text": {
          color: "text.primary",
          transition: "color 0.2s ease-in-out",
        },
        "&:hover, &:focus-visible": {
          backgroundColor: "primary.dark",
          outline: "none",
          "& .navitem-icon": {
            color: "#ffffff",
          },
          "& .navitem-text": {
            color: "#ffffff",
          },
        },
        ...sx,
      }}
    >
      <Box className="navitem-icon">
        {icon}
      </Box>
      {!collapsed && (
        <Typography
          className="navitem-text"
          variant="body1"
          sx={{
            fontWeight: 500,
            fontSize: "0.95rem",
          }}
        >
          {text}
        </Typography>
      )}
    </Box>
  );

  if (collapsed) {
    return (
      <Tooltip title={text} placement="right" arrow>
        {content}
      </Tooltip>
    );
  }

  return content;
};
