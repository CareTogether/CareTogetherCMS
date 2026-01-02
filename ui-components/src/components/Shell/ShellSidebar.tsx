import { Box, BoxProps } from "@mui/material";

type ShellSidebarBaseProps = Pick<BoxProps, "sx">;

export interface ShellSidebarProps extends ShellSidebarBaseProps {
  /**
   * Whether the sidebar is collapsed (88px) or expanded (236px)
   */
  collapsed?: boolean;
  /**
   * Width of the sidebar when expanded (in pixels)
   * @default 236
   */
  expandedWidth?: number;
  /**
   * Width of the sidebar when collapsed (in pixels)
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
  collapsed = false,
  expandedWidth = 236,
  collapsedWidth = 88,
  children,
  sx,
}: ShellSidebarProps) => {
  const currentWidth = collapsed ? collapsedWidth : expandedWidth;

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
