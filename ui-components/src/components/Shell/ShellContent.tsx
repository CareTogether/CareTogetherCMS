import { Box, BoxProps } from "@mui/material";

type ShellContentBaseProps = Pick<BoxProps, "sx" | "component">;

export interface ShellContentProps extends ShellContentBaseProps {
  /**
   * Main application content
   */
  children: React.ReactNode;
  /**
   * Left margin to account for sidebar width (e.g., "240px")
   */
  marginLeft?: string | number;
  /**
   * Top margin to account for header height (e.g., "64px")
   */
  marginTop?: string | number;
  /**
   * Bottom margin to account for footer height (e.g., "48px")
   */
  marginBottom?: string | number;
}

/**
 * Shell content area component providing proper spacing for the main application content.
 * Use as part of the Shell compound component pattern.
 * Automatically handles spacing to avoid overlap with fixed headers, sidebars, and footers.
 *
 * @component
 * @example
 * <Shell.Content marginTop="64px" marginLeft="240px">
 *   <Container>
 *     {pageContent}
 *   </Container>
 * </Shell.Content>
 */
export const ShellContent = ({
  children,
  marginLeft,
  marginTop,
  marginBottom,
  component = "main",
  sx,
}: ShellContentProps) => {
  return (
    <Box
      component={component}
      sx={{
        flexGrow: 1,
        marginLeft,
        marginTop,
        marginBottom,
        display: "flex",
        flexDirection: "column",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};
