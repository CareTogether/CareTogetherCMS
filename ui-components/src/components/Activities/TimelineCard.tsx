import { Box, Card, CardProps, Typography } from "@mui/material";
import { ReactNode } from "react";
import { TimelineItem } from "./TimelineItem";

type TimelineCardBaseProps = Pick<CardProps, "sx" | "className" | "variant" | "elevation">;

export interface TimelineItemData {
  /**
   * Timestamp for the timeline entry
   */
  timestamp: string;
  /**
   * Icon element to display in the timeline
   */
  icon: ReactNode;
  /**
   * Name/title for the timeline entry
   */
  name: string;
  /**
   * Description/subtitle for the timeline entry
   */
  description: string;
}

export interface TimelineCardProps extends TimelineCardBaseProps {
  /**
   * Optional header title text
   */
  title?: string;
  /**
   * Optional sub-header text displayed below the title
   */
  subHeader?: string;
  /**
   * Optional action element(s) to display in the header (e.g., buttons, links)
   */
  actions?: ReactNode;
  /**
   * Array of timeline items to display
   */
  items: TimelineItemData[];
  /**
   * Message to display when items array is empty
   * @default "No timeline entries"
   */
  emptyMessage?: string;
  /**
   * Accessible label for the timeline list
   * @default "Timeline"
   */
  timelineAriaLabel?: string;
}

/**
 * Timeline card component displaying a vertical timeline of events with optional
 * header, sub-header, and action buttons.
 */
export const TimelineCard = ({
  title,
  subHeader,
  actions,
  items,
  emptyMessage = "No timeline entries",
  timelineAriaLabel = "Timeline",
  sx,
  className,
  variant,
  elevation = 0,
}: TimelineCardProps) => {
  return (
    <Card
      className={className}
      variant={variant}
      elevation={elevation}
      sx={{
        p: 2,
        ...sx,
      }}
    >
      {/* Header section */}
      {(title || actions) && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            mb: subHeader || items.length > 0 ? 3 : 0,
            gap: 2,
          }}
        >
          {/* Title */}
          {title && (
            <Typography variant="subtitle1" component="h2">
              {title}
            </Typography>
          )}

          {/* Actions */}
          {actions && (
            <Box
              sx={{
                display: "flex",
                gap: 1,
              }}
            >
              {actions}
            </Box>
          )}
        </Box>
      )}

      {/* Sub header */}
      {subHeader && (
        <Typography
          variant="subtitle2"
          component="h3"
          sx={{
            mb: items.length > 0 ? 2 : 0,
          }}
        >
          {subHeader}
        </Typography>
      )}

      {/* Timeline list */}
      {items.length > 0 ? (
        <Box
          component="ul"
          sx={{
            m: 0,
            p: 0,
          }}
          role="list"
          aria-label={timelineAriaLabel}
        >
          {items.map((item, index) => (
            <TimelineItem
              key={`${item.timestamp}-${index}`}
              timestamp={item.timestamp}
              icon={item.icon}
              name={item.name}
              description={item.description}
              isLast={index === items.length - 1}
            />
          ))}
        </Box>
      ) : (
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            fontStyle: "italic",
            textAlign: "center",
            py: 2,
          }}
          role="status"
        >
          {emptyMessage}
        </Typography>
      )}
    </Card>
  );
};
