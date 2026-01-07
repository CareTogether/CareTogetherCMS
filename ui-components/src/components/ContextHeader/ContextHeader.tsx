import {
  Box,
  Typography,
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  BoxProps,
  BreadcrumbsProps,
  TypographyProps,
  Tabs,
  TabsProps,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { ReactNode, useState, MouseEvent } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

type ContextHeaderBaseProps = Pick<BoxProps, "sx" | "className">;

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface ContextHeaderProps extends ContextHeaderBaseProps {
  /**
   * Content of the header (use compound components)
   */
  children: ReactNode;
}

/**
 * Context-aware header for page-specific information.
 * Use compound components to compose the header layout.
 */
export const ContextHeader = ({ children, sx, className }: ContextHeaderProps) => {
  return (
    <Box className={className} sx={sx}>
      {children}
    </Box>
  );
};

// Breadcrumbs sub-component
type ContextHeaderBreadcrumbsBaseProps = Pick<BreadcrumbsProps, "sx" | "className">;

export interface ContextHeaderBreadcrumbsProps extends ContextHeaderBreadcrumbsBaseProps {
  /**
   * Breadcrumb navigation items
   */
  items: BreadcrumbItem[];
  /**
   * Optional content to display on the right side (e.g., chip, button)
   */
  rightContent?: ReactNode;
}

const ContextHeaderBreadcrumbs = ({
  items,
  rightContent,
  sx,
  className,
}: ContextHeaderBreadcrumbsProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isMobile && rightContent ? "column" : "row",
        justifyContent: "space-between",
        alignItems: isMobile && rightContent ? "flex-start" : "center",
        gap: isMobile && rightContent ? 1.5 : 0,
        my: 2.5,
      }}
    >
      <MuiBreadcrumbs className={className} sx={{ minWidth: 0, ...sx }}>
        {items.map((item, index) =>
          item.href || item.onClick ? (
            <Link
              key={index}
              href={item.href}
              onClick={item.onClick}
              underline="hover"
              color="inherit"
              sx={{
                cursor: item.onClick ? "pointer" : undefined,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </Link>
          ) : (
            <Typography
              key={index}
              color="text.primary"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </Typography>
          )
        )}
      </MuiBreadcrumbs>
      {rightContent && <Box sx={{ ml: isMobile ? 0 : 2, flexShrink: 0 }}>{rightContent}</Box>}
    </Box>
  );
};

// Title sub-component
type ContextHeaderTitleBaseProps = Pick<
  TypographyProps,
  "sx" | "className" | "component" | "variant"
>;

export interface DropdownItem {
  label: string;
  onClick: () => void;
}

export interface ContextHeaderTitleProps extends ContextHeaderTitleBaseProps {
  /**
   * Page title text
   */
  title: string;
  /**
   * Optional dropdown menu items. When provided, the title becomes a button
   * with proper accessibility attributes and an automatic dropdown icon.
   */
  dropdownItems?: DropdownItem[];
  /**
   * Optional chip to display next to title (e.g., status)
   */
  chip?: ReactNode;
  /**
   * Optional action buttons on the right
   */
  actions?: ReactNode;
}

const ContextHeaderTitle = ({
  title,
  dropdownItems,
  chip,
  actions,
  sx,
  className,
  component = "h1",
  variant = "h1",
}: ContextHeaderTitleProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (onClick: () => void) => {
    onClick();
    handleClose();
  };

  // Responsive typography styles
  const responsiveTitleSx = {
    fontSize: isMobile ? "1.75rem" : isTablet ? "2rem" : undefined,
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: isMobile ? 2 : 1,
    WebkitBoxOrient: "vertical" as const,
    wordBreak: "break-word" as const,
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isMobile && actions ? "column" : "row",
        justifyContent: "space-between",
        alignItems: isMobile && actions ? "flex-start" : "center",
        gap: isMobile && actions ? 2 : 0,
        my: 2.5,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: isMobile ? 1 : 2,
          minWidth: 0,
          flex: 1,
        }}
      >
        {dropdownItems ? (
          <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>
            <button
              onClick={handleClick}
              aria-controls={open ? "title-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={open ? "true" : undefined}
              className={className}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                margin: 0,
                font: "inherit",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                minWidth: 0,
              }}
            >
              <Typography
                component={component}
                variant={variant}
                sx={{
                  color: "primary.main",
                  "&:hover, &:focus-visible": {
                    textDecoration: "underline",
                  },
                  ...responsiveTitleSx,
                  ...sx,
                }}
              >
                {title}
              </Typography>
              <ExpandMoreIcon
                sx={{
                  color: "primary.main",
                  fontSize: isMobile ? "1.5rem" : "2rem",
                  flexShrink: 0,
                }}
              />
            </button>
            <Menu
              id="title-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              slotProps={{
                list: {
                  "aria-labelledby": "title-button",
                },
              }}
            >
              {dropdownItems.map((item, index) => (
                <MenuItem key={index} onClick={() => handleMenuItemClick(item.onClick)}>
                  {item.label}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        ) : (
          <Typography
            component={component}
            variant={variant}
            className={className}
            sx={{
              ...responsiveTitleSx,
              ...sx,
            }}
          >
            {title}
          </Typography>
        )}
        {chip}
      </Box>
      {actions && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            ml: isMobile ? 0 : 2,
            flexShrink: 0,
          }}
        >
          {actions}
        </Box>
      )}
    </Box>
  );
};

// Content sub-component
type ContextHeaderContentBaseProps = Pick<BoxProps, "sx" | "className">;

export interface ContextHeaderContentProps extends ContextHeaderContentBaseProps {
  /**
   * Content to display (paragraph text, metadata, etc.)
   */
  children: ReactNode;
}

const ContextHeaderContent = ({ children, sx, className }: ContextHeaderContentProps) => {
  return (
    <Box
      className={className}
      sx={{
        my: 2.5,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

// Tabs sub-component
type ContextHeaderTabsBaseProps = Pick<TabsProps, "sx" | "className" | "value" | "onChange">;

export interface ContextHeaderTabsProps extends ContextHeaderTabsBaseProps {
  /**
   * Tab components (MUI Tab elements)
   */
  children: ReactNode;
  /**
   * Optional content to display on the right (e.g., "Created Feb 21, 2025")
   */
  rightContent?: ReactNode;
}

const ContextHeaderTabs = ({
  children,
  rightContent,
  value,
  onChange,
  sx,
  className,
}: ContextHeaderTabsProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isMobile && rightContent ? "column" : "row",
        justifyContent: "space-between",
        alignItems: isMobile && rightContent ? "flex-start" : "center",
        gap: isMobile && rightContent ? 2 : 0,
        mt: 4,
      }}
    >
      <Tabs
        value={value}
        onChange={onChange}
        className={className}
        variant={isTablet ? "scrollable" : "standard"}
        scrollButtons={isTablet ? "auto" : false}
        sx={{
          minWidth: 0,
          flex: 1,
          ...sx,
        }}
      >
        {children}
      </Tabs>
      {rightContent && (
        <Box sx={{ ml: isMobile ? 0 : 2, mt: isMobile ? 0 : 0, flexShrink: 0 }}>{rightContent}</Box>
      )}
    </Box>
  );
};

// Attach sub-components to main component
ContextHeader.Breadcrumbs = ContextHeaderBreadcrumbs;
ContextHeader.Title = ContextHeaderTitle;
ContextHeader.Content = ContextHeaderContent;
ContextHeader.Tabs = ContextHeaderTabs;
