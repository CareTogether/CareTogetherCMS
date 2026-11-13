import { useMediaQuery, useTheme } from "@mui/material";

/**
 * Hook that provides responsive layout breakpoint flags.
 * Useful for implementing mobile-specific navigation patterns.
 *
 * @returns Object with boolean flags for different screen sizes
 * @example
 * const { isMobile, isTablet, isDesktop } = useResponsiveLayout();
 *
 * return (
 *   <>
 *     {isMobile && <MobileMenu />}
 *     {isDesktop && <DesktopSidebar />}
 *   </>
 * );
 */
export function useResponsiveLayout() {
  const theme = useTheme();

  // Mobile: screens smaller than 'md' breakpoint (typically < 900px)
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Tablet: screens between 'sm' and 'md' breakpoints (typically 600px-900px)
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  // Desktop: screens 'md' breakpoint and above (typically >= 900px)
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  return {
    /**
     * True for screens smaller than 'md' breakpoint (< 900px)
     */
    isMobile,
    /**
     * True for screens between 'sm' and 'md' breakpoints (600px-900px)
     */
    isTablet,
    /**
     * True for screens 'md' breakpoint and above (>= 900px)
     */
    isDesktop,
  };
}
