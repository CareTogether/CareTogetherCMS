import { Box, BoxProps, Typography, useTheme } from "@mui/material";
import { ReactElement } from "react";
import { resolveThemeColor } from "../../../utils";

type ScheduleItemBaseProps = Pick<BoxProps, "sx" | "className">;

export interface ScheduleItemOwnProps {
  /**
   * The text label to display
   */
  label: string;
  /**
   * Color of the left indicator bar (theme color key or hex)
   */
  color: string;
  /**
   * Optional component to render as (e.g., React Router Link, button, 'a', etc.)
   * When not provided, renders as a static Box
   */
  component?: React.ElementType;
  /**
   * Size variant
   * @default "medium"
   */
  size?: "small" | "medium" | "large";
  /**
   * Optional icon or start content
   */
  startIcon?: ReactElement;
}

export type ScheduleItemProps<C extends React.ElementType = "div"> = ScheduleItemOwnProps &
  ScheduleItemBaseProps &
  Omit<React.ComponentPropsWithoutRef<C>, keyof ScheduleItemOwnProps | keyof ScheduleItemBaseProps>;

/**
 * A flexible display component for showing schedule items with a colored
 * indicator bar and label. Can be rendered as a link, button, or static display.
 *
 */
export const ScheduleItem = <C extends React.ElementType = "div">({
  label,
  color,
  component,
  size = "medium",
  startIcon,
  sx,
  className,
  ...rest
}: ScheduleItemProps<C>) => {
  const theme = useTheme();
  const isInteractive = Boolean(component);
  const resolvedColor = resolveThemeColor(color, theme);

  // Size-based dimensions
  const dimensions = {
    small: {
      fontSize: "0.875rem",
      iconSize: 14,
    },
    medium: {
      fontSize: "1rem",
      iconSize: 16,
    },
    large: {
      fontSize: "1.125rem",
      iconSize: 18,
    },
  };

  const sizeConfig = dimensions[size];

  return (
    <Box
      {...(component && { component })}
      className={className}
      sx={{
        background: "none",
        border: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        textDecoration: "none",
        borderRadius: 1,
        color: "inherit",
        p: 0,
        cursor: isInteractive ? "pointer" : "default",
        transition: theme.transitions.create(["background-color", "transform"], {
          duration: theme.transitions.duration.shorter,
        }),
        ...(isInteractive && {
          "&:hover .schedule-item__text, &:focus-visible .schedule-item__text": {
            textDecoration: "underline",
          },
        }),
        ...sx,
      }}
      {...rest}
    >
      <Box
        className="schedule-item__indicator-bar"
        sx={{
          inlineSize: ".25em",
          blockSize: "1em",
          backgroundColor: resolvedColor,
          borderRadius: 1,
        }}
      />
      {startIcon && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: resolvedColor,
            fontSize: sizeConfig.iconSize,
            "& > svg": {
              fontSize: "inherit",
            },
          }}
        >
          {startIcon}
        </Box>
      )}
      <Typography
        className="schedule-item__text"
        component="span"
        sx={{
          fontSize: sizeConfig.fontSize,
          lineHeight: 1.5,
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={label}
      >
        {label}
      </Typography>
    </Box>
  );
};
