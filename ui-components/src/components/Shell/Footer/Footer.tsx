import { Box, Typography, Link, BoxProps } from "@mui/material";

type FooterBaseProps = Pick<BoxProps, "sx">;

export interface FooterProps extends FooterBaseProps {
  /**
   * Copyright text
   */
  copyrightText?: string;
  /**
   * Application version
   */
  version?: string;
}

/**
 * Application footer component for shell layout
 * @component
 * @example
 * <Footer copyrightText="© 2025 CareTogether" version="1.0.0" />
 */
export const Footer = ({
  copyrightText = "© 2025 CareTogether",
  version,
  sx,
}: FooterProps) => {
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 3,
        mt: "auto",
        borderTop: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
        ...sx,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {copyrightText}
        </Typography>
        {version && (
          <Typography variant="caption" color="text.secondary">
            Version {version}
          </Typography>
        )}
        {/* TODO: Add footer links (Privacy, Terms, Support) */}
      </Box>
    </Box>
  );
};
