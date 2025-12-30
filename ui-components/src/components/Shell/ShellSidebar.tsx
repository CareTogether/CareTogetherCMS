import { Drawer, Box, DrawerProps } from "@mui/material";

type ShellSidebarBaseProps = Pick<DrawerProps, "sx" | "variant" | "anchor">;

export interface ShellSidebarProps extends ShellSidebarBaseProps {
  /**
   * Whether the sidebar is open
   */
  open?: boolean;
  /**
   * Width of the sidebar when open (in pixels)
   */
  width?: number;
  /**
   * Content to display inside the sidebar
   */
  children?: React.ReactNode;
  /**
   * Whether the sidebar should be permanent (not closeable)
   */
  permanent?: boolean;
}

/**
 * Shell sidebar component providing a flexible navigation drawer.
 * Use as part of the Shell compound component pattern.
 * Consumers are responsible for providing their own navigation items and state management.
 *
 * @component
 * @example
 * const [open, setOpen] = useState(true);
 *
 * <Shell.Sidebar open={open} width={240}>
 *   <List>
 *     <ListItem button><ListItemText primary="Dashboard" /></ListItem>
 *     <ListItem button><ListItemText primary="Settings" /></ListItem>
 *   </List>
 * </Shell.Sidebar>
 */
export const ShellSidebar = ({
  open = true,
  width = 240,
  children,
  variant = "persistent",
  anchor = "left",
  permanent = false,
  sx,
}: ShellSidebarProps) => {
  return (
    <Drawer
      variant={permanent ? "permanent" : variant}
      anchor={anchor}
      open={open}
      sx={{
        width: open ? width : 0,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: width,
          boxSizing: "border-box",
          position: permanent ? "relative" : undefined,
        },
        ...sx,
      }}
    >
      <Box sx={{ overflow: "auto", height: "100%" }}>{children}</Box>
    </Drawer>
  );
};
