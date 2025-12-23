import { Box, Typography, Breadcrumbs, Link, BoxProps } from "@mui/material";

type ContextHeaderBaseProps = Pick<BoxProps, "sx">;

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface ContextHeaderProps extends ContextHeaderBaseProps {
  /**
   * Page title
   */
  title: string;
  /**
   * Optional subtitle or description
   */
  subtitle?: string;
  /**
   * Breadcrumb navigation items
   */
  breadcrumbs?: BreadcrumbItem[];
}

/**
 * Context-aware header for page-specific information
 * @component
 * @example
 * <ContextHeader 
 *   title="Family Details" 
 *   subtitle="Smith Family"
 *   breadcrumbs={[{label: "Home", href: "/"}, {label: "Families"}]}
 * />
 */
export const ContextHeader = ({
  title,
  subtitle,
  breadcrumbs,
  sx,
}: ContextHeaderProps) => {
  return (
    <Box
      sx={{
        py: 3,
        px: 3,
        borderBottom: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
        ...sx,
      }}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 2 }}>
          {breadcrumbs.map((item, index) => (
            item.href ? (
              <Link key={index} href={item.href} underline="hover" color="inherit">
                {item.label}
              </Link>
            ) : (
              <Typography key={index} color="text.primary">
                {item.label}
              </Typography>
            )
          ))}
        </Breadcrumbs>
      )}
      <Typography variant="h4" component="h1" gutterBottom>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body1" color="text.secondary">
          {subtitle}
        </Typography>
      )}
      {/* TODO: Add action buttons, tabs, filters */}
    </Box>
  );
};
