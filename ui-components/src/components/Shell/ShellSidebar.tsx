import { Box, BoxProps } from "@mui/material";

type ShellSidebarBaseProps = Pick<BoxProps, "sx">;

export interface ShellSidebarProps extends ShellSidebarBaseProps {
  /**
   * Whether the sidebar is open (expanded) or closed (collapsed)
   * Note: This prop is for styling only. Pass sidebarOpen to the Shell component for layout.
   * @default true
   */
  open?: boolean;
  /**
   * Width of the sidebar when expanded (in pixels)
   * Note: This prop is for styling only. Pass sidebarExpandedWidth to Shell for layout.
   * @default 236
   */
  expandedWidth?: number;
  /**
   * Width of the sidebar when collapsed (in pixels)
   * Note: This prop is for styling only. Pass sidebarCollapsedWidth to Shell for layout.
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
 * Use as part of the Shell compound component pattern.
 */
export const ShellSidebar = ({
  open = true,
  expandedWidth = 236,
  collapsedWidth = 88,
  children,
  sx,
}: ShellSidebarProps) => {
  const currentWidth = open ? expandedWidth : collapsedWidth;

  return (
    <Box
      component="nav"
      sx={{
        width: currentWidth,
        transition: "width 0.2s ease-in-out",
        overflow: "auto",
        borderRight: 1,
        borderColor: "divider",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};
