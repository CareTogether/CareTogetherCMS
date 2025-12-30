import { Box, BoxProps } from "@mui/material";

type ShellFooterBaseProps = Pick<BoxProps, "sx" | "component">;

export interface ShellFooterProps extends ShellFooterBaseProps {
  /**
   * Footer content
   */
  children?: React.ReactNode;
  /**
   * Position of the footer
   */
  position?: "static" | "fixed" | "sticky";
}

/**
 * Shell footer component providing a flexible footer layout.
 * Use as part of the Shell compound component pattern.
 * Consumers are responsible for providing their own footer content (copyright, version, links, etc.).
 *
 * @component
 * @example
 * <Shell.Footer>
 *   <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
 *     <Typography variant="body2">© 2025 MyApp</Typography>
 *     <Typography variant="caption">v1.0.0</Typography>
 *   </Box>
 * </Shell.Footer>
 */
export const ShellFooter = ({
  children,
  position = "static",
  component = "footer",
  sx,
}: ShellFooterProps) => {
  return (
    <Box
      component={component}
      sx={{
        py: 2,
        px: 3,
        mt: position === "static" ? "auto" : 0,
        borderTop: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
        position,
        bottom: position === "fixed" ? 0 : undefined,
        left: position === "fixed" ? 0 : undefined,
        right: position === "fixed" ? 0 : undefined,
        zIndex: position === "fixed" ? 1000 : undefined,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};
