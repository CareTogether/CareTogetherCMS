import { Box, BoxProps } from "@mui/material";
import React, { useMemo } from "react";
import { ShellHeader } from "./ShellHeader";
import { ShellSidebar } from "./ShellSidebar";
import { ShellContent } from "./ShellContent";
import { ShellFooter } from "./ShellFooter";
import { ShellContext } from "./ShellContext";

type ShellBaseProps = Pick<BoxProps, "sx">;

export interface ShellProps extends ShellBaseProps {
  /**
   * Shell layout children (typically Shell.Header, Shell.Sidebar, Shell.Content, Shell.Footer)
   */
  children: React.ReactNode;
  /**
   * Whether the sidebar is open (expanded) or closed (collapsed).
   * @default true
   */
  sidebarOpen?: boolean;
  /**
   * Width of the sidebar when expanded (in pixels).
   * @default 236
   */
  sidebarExpandedWidth?: number;
  /**
   * Width of the sidebar when collapsed (in pixels).
   * @default 88
   */
  sidebarCollapsedWidth?: number;
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
export const Shell: React.FC<ShellProps> & ShellComposition = ({
  children,
  sx,
  sidebarOpen = true,
  sidebarExpandedWidth = 236,
  sidebarCollapsedWidth = 88,
}) => {
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

  // Calculate sidebar width from Shell's own props
  const sidebarWidth = sidebar ? (sidebarOpen ? sidebarExpandedWidth : sidebarCollapsedWidth) : 0;

  const headerHeight = 64; // Standard AppBar height

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      headerHeight,
      sidebarWidth,
      sidebarOpen,
      sidebarExpandedWidth,
      sidebarCollapsedWidth,
    }),
    [headerHeight, sidebarWidth, sidebarOpen, sidebarExpandedWidth, sidebarCollapsedWidth]
  );

  return (
    <ShellContext.Provider value={contextValue}>
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

        {/* Sidebar - Fixed position, consumes context for state */}
        {sidebar}

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
    </ShellContext.Provider>
  );
};

// Attach compound components
Shell.Header = ShellHeader;
Shell.Sidebar = ShellSidebar;
Shell.Content = ShellContent;
Shell.Footer = ShellFooter;
