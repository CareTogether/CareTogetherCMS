import { Box, BoxProps, Typography } from "@mui/material";
import { ReactNode } from "react";

type TimelineItemBaseProps = Pick<BoxProps, "sx" | "className">;

export interface TimelineItemProps extends TimelineItemBaseProps {
  /**
   * Timestamp text displayed on the left
   */
  timestamp: string;
  /**
   * Icon element to display in the timeline
   */
  icon: ReactNode;
  /**
   * Name/title text (primary text on the right)
   */
  name: string;
  /**
   * Description/subtitle text (secondary text below name)
   */
  description: string;
  /**
   * Whether this is the last item in the timeline (affects connector line)
   * @default false
   */
  isLast?: boolean;
}

/**
 * Timeline item component displaying a timestamp, vertical connector with icon,
 * and content (name + description). Designed for use within TimelineCard.
 */
export const TimelineItem = ({
  timestamp,
  icon,
  name,
  description,
  isLast = false,
  sx,
  className,
}: TimelineItemProps) => {
  return (
    <Box
      component="li"
      className={className}
      sx={{
        display: "flex",
        gap: 1,
        position: "relative",
        listStyle: "none",
        ...sx,
      }}
      role="listitem"
    >
      {/* Timestamp column */}
      <Box
        sx={{
          flexShrink: 0,
          width: "140px",
          pt: 0.5,
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontSize: "0.875rem",
          }}
        >
          <time>{timestamp}</time>
        </Typography>
      </Box>

      {/* Icon column with vertical connector line */}
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            flexShrink: 0,
            zIndex: 1,
            color: "primary.main",
            fontSize: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "& > *": {
              fontSize: "inherit",
              flexShrink: 0,
            },
          }}
          aria-hidden="true"
        >
          {icon}
        </Box>

        {/* Vertical connector line */}
        {!isLast && (
          <Box
            sx={{
              width: "2px",
              flexGrow: 1,
              backgroundColor: "primary.main",
            }}
            aria-hidden="true"
          />
        )}
      </Box>

      {/* Content column */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0.25,
          minWidth: 0,
          pb: 2,
        }}
      >
        <Typography
          variant="body1"
          sx={{
            fontWeight: 500,
          }}
        >
          {name}
        </Typography>
        <Typography variant="body2" color="grey.900">
          {description}
        </Typography>
      </Box>
    </Box>
  );
};
