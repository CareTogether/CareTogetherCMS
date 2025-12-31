import { Box, BoxProps, Card, Typography } from "@mui/material";
import { ReactNode } from "react";

type RecentActivityBaseProps = Pick<BoxProps, "sx" | "className">;

export interface RecentActivityProps extends RecentActivityBaseProps {
  /**
   * Content of the recent activity card (use compound components)
   */
  children: ReactNode;
}

interface RecentActivityComposition {
  Header: typeof RecentActivityHeader;
  Group: typeof RecentActivityGroup;
}

/**
 * Recent activity card container using compound component pattern.
 */
export const RecentActivity: React.FC<RecentActivityProps> & RecentActivityComposition = ({
  children,
  sx,
  className,
}) => {
  return (
    <Card
      elevation={0}
      className={className}
      sx={{
        p: 2,
        ...sx,
      }}
    >
      {children}
    </Card>
  );
};

// Header sub-component
type RecentActivityHeaderBaseProps = Pick<BoxProps, "sx" | "className">;

export interface RecentActivityHeaderProps extends RecentActivityHeaderBaseProps {
  /**
   * Header text content
   */
  children: ReactNode;
  /**
   * Optional action element to display on the right (e.g., link, button)
   */
  action?: ReactNode;
}

const RecentActivityHeader = ({ children, action, sx, className }: RecentActivityHeaderProps) => {
  return (
    <Box
      className={className}
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 2,
        ...sx,
      }}
    >
      <Typography variant="h6">{children}</Typography>
      {action && <Box>{action}</Box>}
    </Box>
  );
};

// Group sub-component
type RecentActivityGroupBaseProps = Pick<BoxProps, "sx" | "className">;

export interface RecentActivityGroupProps extends RecentActivityGroupBaseProps {
  /**
   * Group title/header text (e.g., "Today", "Yesterday")
   */
  title?: string;
  /**
   * Activity items to display in this group
   */
  children: ReactNode;
}

const RecentActivityGroup = ({ title, children, sx, className }: RecentActivityGroupProps) => {
  return (
    <Box
      className={className}
      sx={{
        "&:not(:last-child)": {
          mb: 2,
        },
        ...sx,
      }}
    >
      {title && (
        <Typography
          variant="h6"
          color="text.secondary"
          fontWeight={400}
          sx={{
            mb: 2,
          }}
        >
          {title}
        </Typography>
      )}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

// Attach compound components
RecentActivity.Header = RecentActivityHeader;
RecentActivity.Group = RecentActivityGroup;
