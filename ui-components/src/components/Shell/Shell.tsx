import { Box, BoxProps } from "@mui/material";
import React from "react";
import { ShellHeader } from "./ShellHeader";
import { ShellSidebar, ShellSidebarProps } from "./ShellSidebar";
import { ShellContent } from "./ShellContent";
import { ShellFooter } from "./ShellFooter";

type ShellBaseProps = Pick<BoxProps, "sx">;

export interface ShellProps extends ShellBaseProps {
  /**
   * Shell layout children (typically Shell.Header, Shell.Sidebar, Shell.Content, Shell.Footer)
   */
  children: React.ReactNode;
}

interface ShellComposition {
  Header: typeof ShellHeader;
  Sidebar: typeof ShellSidebar;
  Content: typeof ShellContent;
  Footer: typeof ShellFooter;
}

/**
 * Root shell layout container using compound component pattern.
 * Provides the base structure for application layouts with flexible composition.
 */
export const Shell: React.FC<ShellProps> & ShellComposition = ({ children, sx }) => {
  // Separate children by type to arrange them properly
  const childArray = React.Children.toArray(children);
  const header = childArray.find(
    (child) => React.isValidElement(child) && child.type === ShellHeader
  );
  const sidebar = childArray.find(
    (child) => React.isValidElement(child) && child.type === ShellSidebar
  );
  const content = childArray.find(
    (child) => React.isValidElement(child) && child.type === ShellContent
  );
  const footer = childArray.find(
    (child) => React.isValidElement(child) && child.type === ShellFooter
  );

  // Get sidebar width from props
  const sidebarCollapsed = React.isValidElement(sidebar)
    ? ((sidebar.props as { collapsed?: boolean }).collapsed ?? false)
    : false;
  const expandedWidth = React.isValidElement(sidebar)
    ? ((sidebar.props as { expandedWidth?: number }).expandedWidth ?? 236)
    : 236;
  const collapsedWidth = React.isValidElement(sidebar)
    ? ((sidebar.props as { collapsedWidth?: number }).collapsedWidth ?? 88)
    : 88;
  const sidebarWidth = sidebar ? (sidebarCollapsed ? collapsedWidth : expandedWidth) : 0;

  const headerHeight = 64; // Standard AppBar height

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        ...sx,
      }}
    >
      {/* Header - Full width, fixed */}
      {header}

      {/* Sidebar - Fixed position */}
      {sidebar &&
        React.isValidElement<ShellSidebarProps>(sidebar) &&
        React.cloneElement(sidebar, {
          sx: {
            position: "fixed",
            top: headerHeight,
            left: 0,
            height: `calc(100vh - ${headerHeight}px)`,
            ...sidebar.props.sx,
          },
        })}

      {/* Content column - Scrollable with padding for fixed elements */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "auto",
          marginTop: `${headerHeight}px`,
          marginLeft: `${sidebarWidth}px`,
          transition: "margin-left 0.2s ease-in-out",
        }}
      >
        {content}
        {footer}
      </Box>
    </Box>
  );
};

// Attach compound components
Shell.Header = ShellHeader;
Shell.Sidebar = ShellSidebar;
Shell.Content = ShellContent;
Shell.Footer = ShellFooter;
