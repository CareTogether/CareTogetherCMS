import { useState } from "react";
import { Typography, TypographyProps, Button, Box } from "@mui/material";
import { truncate } from "lodash";

type ExpandableTextBaseProps = Pick<TypographyProps, "sx" | "className" | "variant" | "color">;

export interface ExpandableTextProps extends ExpandableTextBaseProps {
  /**
   * The text content to display
   */
  text: string;
  /**
   * Maximum string length before truncation
   * @default 150
   */
  length?: number;
  /**
   * The string to indicate text is omitted
   * @default "..."
   */
  omission?: string;
  /**
   * The separator pattern to truncate to (string or RegExp)
   */
  separator?: string | RegExp;
  /**
   * Text for expand button
   * @default "More"
   */
  expandText?: string;
  /**
   * Text for collapse button
   * @default "Less"
   */
  collapseText?: string;
}

/**
 * ExpandableText component that truncates text based on character length
 * with an inline expand/collapse button. Only shows the button if text is truncated.
 *
 * Includes proper ARIA attributes for accessibility.
 */
export const ExpandableText = ({
  text,
  length = 150,
  omission = "...",
  separator,
  expandText = "More",
  collapseText = "Less",
  variant = "body1",
  color,
  sx,
  className,
}: ExpandableTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Return null for empty text
  if (!text?.trim()) {
    return null;
  }

  const truncatedText = truncate(text, { length, omission, separator });
  const showButton = truncatedText !== text;

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const displayText = isExpanded ? text : truncatedText;

  return (
    <Box sx={sx} className={className}>
      <Typography
        variant={variant}
        color={color}
        sx={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {displayText}{" "}
        {showButton && (
          <Button
            color="primaryDark"
            variant="text"
            size="small"
            onClick={handleToggle}
            aria-label={isExpanded ? "Show less content" : "Show more content"}
            aria-expanded={isExpanded}
            sx={{
              minWidth: "auto",
              padding: 0,
              textTransform: "none",
              fontWeight: 500,
              fontSize: "inherit",
              lineHeight: "inherit",
              verticalAlign: "baseline",
              "&:hover": {
                backgroundColor: "transparent",
                textDecoration: "underline",
              },
            }}
          >
            {isExpanded ? collapseText : expandText}
          </Button>
        )}
      </Typography>
    </Box>
  );
};
