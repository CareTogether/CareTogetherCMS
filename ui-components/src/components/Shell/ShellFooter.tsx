import { CardProps, Card } from "@mui/material";

type ShellFooterBaseProps = Pick<CardProps, "sx" | "component">;

export interface ShellFooterProps extends ShellFooterBaseProps {
  /**
   * Footer content
   */
  children?: React.ReactNode;
}

/**
 * Shell footer component providing a flexible footer layout.
 * Use as part of the Shell compound component pattern.
 */
export const ShellFooter = ({ children, component = "footer", sx }: ShellFooterProps) => {
  return (
    <Card
      component={component}
      elevation={2}
      sx={{
        mt: "auto",
        borderRadius: 0,
        flexShrink: 0,
        ...sx,
      }}
    >
      {children}
    </Card>
  );
};
