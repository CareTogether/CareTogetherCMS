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
export declare function useResponsiveLayout(): {
    /**
     * True for screens smaller than 'md' breakpoint (< 900px)
     */
    isMobile: boolean;
    /**
     * True for screens between 'sm' and 'md' breakpoints (600px-900px)
     */
    isTablet: boolean;
    /**
     * True for screens 'md' breakpoint and above (>= 900px)
     */
    isDesktop: boolean;
};
//# sourceMappingURL=useResponsiveLayout.d.ts.map