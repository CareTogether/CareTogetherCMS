import { Box, BoxProps } from "@mui/material";
import { useShellContext } from "./ShellContext";

type ShellSidebarBaseProps = Pick<BoxProps, "sx">;

export interface ShellSidebarProps extends ShellSidebarBaseProps {
  /**
   * Whether the sidebar is open (expanded) or closed (collapsed).
   * When used inside Shell, automatically consumes from context.
   * @default true
   */
  open?: boolean;
  /**
   * Width of the sidebar when expanded (in pixels).
   * When used inside Shell, automatically consumes from context.
   * @default 236
   */
  expandedWidth?: number;
  /**
   * Width of the sidebar when collapsed (in pixels).
   * When used inside Shell, automatically consumes from context.
   * @default 88
   */
  collapsedWidth?: number;
  /**
   * Content to display inside the sidebar
   */
  children?: React.ReactNode;
}

/**
 * Shell sidebar component providing a persistent navigation sidebar.
 * When used inside Shell, automatically consumes open/width state from context.
 * Can also be used standalone by passing props directly.
 */
export const ShellSidebar = ({
  open: openProp = true,
  expandedWidth: expandedWidthProp = 236,
  collapsedWidth: collapsedWidthProp = 88,
  children,
  sx,
}: ShellSidebarProps) => {
  const context = useShellContext();

  // Use context values if in Shell, otherwise fall back to props
  const open = context?.sidebarOpen ?? openProp;
  const expandedWidth = context?.sidebarExpandedWidth ?? expandedWidthProp;
  const collapsedWidth = context?.sidebarCollapsedWidth ?? collapsedWidthProp;
  const headerHeight = context?.headerHeight ?? 64;

  const currentWidth = open ? expandedWidth : collapsedWidth;
  const isInShell = context !== null;

  return (
    <Box
      component="nav"
      sx={{
        width: currentWidth,
        transition: "width 0.2s ease-in-out",
        overflow: "auto",
        borderRight: 1,
        borderColor: "divider",
        // When in Shell, apply fixed positioning
        ...(isInShell && {
          position: "fixed",
          top: headerHeight,
          left: 0,
          height: `calc(100vh - ${headerHeight}px)`,
        }),
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};
