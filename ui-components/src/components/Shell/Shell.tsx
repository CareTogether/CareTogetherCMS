import { Box, BoxProps, useMediaQuery, useTheme, Breakpoint } from "@mui/material";
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
  /**
   * Breakpoint at which the sidebar should be hidden.
   * When specified, the sidebar will be hidden on screens smaller than this breakpoint.
   * This allows consumers to implement their own mobile navigation (e.g., drawer, bottom nav).
   *
   * Common pattern: Set to 'md' to hide sidebar on mobile/tablet, showing it only on desktop.
   *
   * @default undefined (sidebar always rendered)
   * @example
   * // Hide sidebar on mobile, consumer implements mobile menu
   * <Shell hideSidebarBelow="md">
   *   <Shell.Header leftContent={isMobile ? <HamburgerButton /> : <SidebarToggle />} />
   *   <Shell.Sidebar>...</Shell.Sidebar>
   * </Shell>
   */
  hideSidebarBelow?: Breakpoint;
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
 *
 * For mobile navigation, use the `hideSidebarBelow` prop to hide the sidebar on smaller screens,
 * then implement your own mobile menu solution (e.g., MUI Drawer, BottomNavigation).
 */
export const Shell: React.FC<ShellProps> & ShellComposition = ({
  children,
  sx,
  sidebarOpen = true,
  sidebarExpandedWidth = 236,
  sidebarCollapsedWidth = 88,
  hideSidebarBelow,
}) => {
  const theme = useTheme();
  // Always call useMediaQuery unconditionally to follow React Hooks rules
  const isBelowBreakpoint = useMediaQuery(
    hideSidebarBelow ? theme.breakpoints.down(hideSidebarBelow) : "(min-width: 0px)"
  );
  const shouldHideSidebar = hideSidebarBelow ? isBelowBreakpoint : false;

  // Separate children by type to arrange them properly
  const childArray = React.Children.toArray(children);
  const header = childArray.find(
    (child) => React.isValidElement(child) && child.type === ShellHeader
  );
  const sidebarChild = childArray.find(
    (child) => React.isValidElement(child) && child.type === ShellSidebar
  );
  const content = childArray.find(
    (child) => React.isValidElement(child) && child.type === ShellContent
  );
  const footer = childArray.find(
    (child) => React.isValidElement(child) && child.type === ShellFooter
  );

  // Conditionally hide sidebar based on responsive breakpoint
  const sidebar = shouldHideSidebar ? null : sidebarChild;

  // Calculate sidebar width from Shell's own props
  const sidebarWidth = sidebar ? (sidebarOpen ? sidebarExpandedWidth : sidebarCollapsedWidth) : 0;

  // Use MUI's toolbar mixin for responsive header height
  // Mobile: 56px, Desktop (sm+): 64px
  const toolbarMinHeight = theme.mixins.toolbar.minHeight as number;
  const headerHeight = toolbarMinHeight || 64;

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
