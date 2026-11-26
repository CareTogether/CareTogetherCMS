import { Box, BoxProps, Typography } from "@mui/material";
import { ReactNode } from "react";

type ActivityItemBaseProps = Pick<BoxProps, "sx" | "className">;

export interface ActivityItemProps extends ActivityItemBaseProps {
  /**
   * Icon element to display on the left
   */
  icon: ReactNode;
  /**
   * Time text (displayed as secondary text above the title)
   */
  time: string;
  /**
   * Title/name text (primary text)
   */
  title: string;
  /**
   * Optional action element to display below the title (e.g., link, button)
   */
  action?: ReactNode;
}

/**
 * Activity item component displaying an icon, timestamp, title, and optional action.
 */
export const ActivityItem = ({ icon, time, title, action, sx, className }: ActivityItemProps) => {
  return (
    <Box
      className={className}
      sx={{
        display: "flex",
        gap: 1,
        alignItems: "flex-start",
        ...sx,
      }}
    >
      {/* Icon on the left */}
      <Box sx={{ flexShrink: 0 }}>{icon}</Box>

      {/* Content stack */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            fontSize: "0.875rem",
          }}
        >
          {time}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: "text.primary",
          }}
        >
          {title}
        </Typography>
        {action && <Box>{action}</Box>}
      </Box>
    </Box>
  );
};
