import { AppBar, Toolbar, Box, AppBarProps } from "@mui/material";

type ShellHeaderBaseProps = Pick<AppBarProps, "sx" | "color" | "elevation" | "position">;

export interface ShellHeaderProps extends ShellHeaderBaseProps {
  /**
   * Content displayed on the left side of the header (typically menu button, logo)
   */
  leftContent?: React.ReactNode;
  /**
   * Content displayed in the center of the header (typically title, breadcrumbs)
   */
  centerContent?: React.ReactNode;
  /**
   * Content displayed on the right side of the header (typically search, user menu, notifications)
   */
  rightContent?: React.ReactNode;
}

/**
 * Shell header component providing a flexible header layout with three content areas.
 * Use as part of the Shell compound component pattern.
 *
 * @component
 * @example
 * <Shell.Header
 *   leftContent={<IconButton><MenuIcon /></IconButton>}
 *   centerContent={<Typography variant="h6">My App</Typography>}
 *   rightContent={<UserProfileMenu />}
 * />
 */
export const ShellHeader = ({
  leftContent,
  centerContent,
  rightContent,
  position = "fixed",
  elevation = 1,
  color = "primary",
  sx,
}: ShellHeaderProps) => {
  return (
    <AppBar position={position} elevation={elevation} color={color} sx={sx}>
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {leftContent && (
          <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>{leftContent}</Box>
        )}
        {centerContent && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexGrow: 1,
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {centerContent}
          </Box>
        )}
        {rightContent && (
          <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0, gap: 1 }}>
            {rightContent}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};
