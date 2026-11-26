import { Chip, ChipProps, useTheme, alpha } from "@mui/material";
import { ReactElement } from "react";
import { resolveThemeColor } from "../../../utils";

type ColoredChipBaseProps = Pick<ChipProps, "variant" | "sx" | "className">;

export interface ColoredChipProps extends ColoredChipBaseProps {
  /**
   * The chip label text
   */
  label: string;
  /**
   * Optional icon element to display before the label
   */
  startIcon?: ReactElement;
  /**
   * Icon color - can be a theme color key or custom hex color
   * @default "grey.900"
   */
  color?: "success" | "info" | "warning" | "error" | "primary" | "secondary" | string;
  /**
   * Size of the chip
   * @default "medium"
   */
  size?: "small" | "medium";
}

/**
 * Generic chip component with optional colored icon and lightened background.
 */
export const ColoredChip = ({
  label,
  startIcon,
  color = "grey.900",
  size = "medium",
  sx,
  ...rest
}: ColoredChipProps) => {
  const theme = useTheme();

  // Resolve the icon color from theme or use custom color
  const resolvedIconColor =
    color === "grey.900" ? theme.palette.grey[900] : resolveThemeColor(color, theme);

  // Create lightened background color
  const backgroundColor = alpha(resolvedIconColor, 0.12);

  // Size-based styling using theme tokens
  const isSmall = size === "small";
  const chipHeight = isSmall ? theme.spacing(3) : theme.spacing(4); // 24px / 32px
  const fontSize = isSmall ? theme.typography.body2.fontSize : theme.typography.body1.fontSize; // 12px / 14px
  const iconSize = isSmall ? 20 : 24; // px

  return (
    <Chip
      label={label}
      icon={startIcon}
      sx={{
        backgroundColor,
        color: theme.palette.grey[900],
        fontSize,
        height: chipHeight,
        px: 1,
        "& .MuiChip-icon": {
          color: resolvedIconColor,
          fontSize: iconSize,
          width: iconSize,
          height: iconSize,
          marginRight: 0.75,
          marginLeft: 0,
        },
        "& .MuiChip-label": {
          fontSize,
          px: 0,
        },
        ...sx,
      }}
      {...rest}
    />
  );
};
