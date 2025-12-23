import { AppBar, Toolbar, Typography, Box, BoxProps } from "@mui/material";

type HeaderBaseProps = Pick<BoxProps, "sx">;

export interface HeaderProps extends HeaderBaseProps {
  /**
   * Application title displayed in header
   */
  title?: string;
  /**
   * Optional subtitle or context information
   */
  subtitle?: string;
}

/**
 * Application header component for shell layout
 * @component
 * @example
 * <Header title="CareTogether CMS" subtitle="Family Management" />
 */
export const Header = ({ title = "CareTogether", subtitle, sx }: HeaderProps) => {
  return (
    <Box sx={sx}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ ml: 2 }}>
              {subtitle}
            </Typography>
          )}
          {/* TODO: Add navigation menu, user profile, notifications */}
        </Toolbar>
      </AppBar>
    </Box>
  );
};
