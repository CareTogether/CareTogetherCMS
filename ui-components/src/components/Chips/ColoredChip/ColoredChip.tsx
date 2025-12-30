import { Chip, ChipProps, useTheme, alpha } from "@mui/material";
import { ReactElement } from "react";

type ColoredChipBaseProps = Pick<ChipProps, "size" | "variant" | "sx" | "className">;

export interface ColoredChipProps extends ColoredChipBaseProps {
  /**
   * The chip label text
   */
  label: string;
  /**
   * Optional icon element to display before the label
   */
  icon?: ReactElement;
  /**
   * Icon color - can be a theme color key or custom hex color
   * @default "grey.900"
   */
  iconColor?: "success" | "info" | "warning" | "error" | "primary" | "secondary" | string;
}

/**
 * Generic chip component with optional colored icon and lightened background.
 */
export const ColoredChip = ({
  label,
  icon,
  iconColor = "grey.900",
  size = "small",
  sx,
  ...rest
}: ColoredChipProps) => {
  const theme = useTheme();

  // Resolve the icon color from theme or use custom color
  const resolvedIconColor = (() => {
    switch (iconColor) {
      case "success":
        return theme.palette.success.main;
      case "info":
        return theme.palette.info.main;
      case "warning":
        return theme.palette.warning.main;
      case "error":
        return theme.palette.error.main;
      case "primary":
        return theme.palette.primary.main;
      case "secondary":
        return theme.palette.secondary.main;
      case "grey.900":
        return theme.palette.grey[900];
      default:
        return iconColor; // Assume it's a custom color string
    }
  })();

  // Create lightened background color
  const backgroundColor = alpha(resolvedIconColor, 0.12);

  return (
    <Chip
      label={label}
      icon={icon}
      size={size}
      sx={{
        backgroundColor,
        color: theme.palette.grey[900],
        fontSize: "14px",
        height: "32px",
        px: 1,
        "& .MuiChip-icon": {
          color: resolvedIconColor,
          fontSize: "24px",
          width: "24px",
          height: "24px",
          marginRight: 0.75,
          marginLeft: 0,
        },
        "& .MuiChip-label": {
          fontSize: "14px",
          px: 0,
        },
        ...sx,
      }}
      {...rest}
    />
  );
};
