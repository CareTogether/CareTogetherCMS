import { Box, BoxProps, alpha } from "@mui/material";
import Diversity2Icon from "@mui/icons-material/Diversity2";
import { ReactNode } from "react";

type ActivityIconBaseProps = Pick<BoxProps, "sx" | "className">;

export interface ActivityIconProps extends ActivityIconBaseProps {
  /**
   * Icon element to display (defaults to Diversity2Icon)
   */
  icon?: ReactNode;
  /**
   * Background color for the icon container.
   * Can be a hex color string (e.g., "#FDD835") or any valid CSS color.
   */
  color: string;
  /**
   * Size of the icon container in pixels
   * @default 44
   */
  size?: number;
}

/**
 * Activity icon component displaying an icon with a colored circular background.
 * Defaults to MUI Diversity2 icon if no icon is provided.
 */
export const ActivityIcon = ({ icon, color, size = 44, sx, className }: ActivityIconProps) => {
  const iconSize = size * 0.6; // Icon is 60% of container size

  return (
    <Box
      className={className}
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: alpha(color, 0.15),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        ...sx,
      }}
    >
      {icon ?? (
        <Diversity2Icon
          sx={{
            fontSize: iconSize,
            color: color,
          }}
        />
      )}
    </Box>
  );
};
