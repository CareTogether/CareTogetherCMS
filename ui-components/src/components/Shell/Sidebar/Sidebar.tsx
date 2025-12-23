import { Drawer, List, ListItem, ListItemText, Box, BoxProps } from "@mui/material";

type SidebarBaseProps = Pick<BoxProps, "sx">;

export interface SidebarProps extends SidebarBaseProps {
  /**
   * Whether the sidebar is open
   */
  open?: boolean;
  /**
   * Width of the sidebar when open
   */
  width?: number;
}

/**
 * Application sidebar component for shell layout
 * @component
 * @example
 * <Sidebar open={true} width={240} />
 */
export const Sidebar = ({ open = true, width = 240, sx }: SidebarProps) => {
  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: open ? width : 0,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: width,
          boxSizing: "border-box",
          position: "relative",
        },
        ...sx,
      }}
    >
      <Box sx={{ overflow: "auto", pt: 2 }}>
        <List>
          {/* TODO: Add navigation items */}
          <ListItem>
            <ListItemText primary="Navigation Item 1" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Navigation Item 2" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Navigation Item 3" />
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};
