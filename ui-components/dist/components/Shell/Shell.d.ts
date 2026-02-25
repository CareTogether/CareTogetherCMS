import { BoxProps, Breakpoint } from '@mui/material';
import { default as React } from 'react';
import { ShellHeader } from './ShellHeader';
import { ShellSidebar } from './ShellSidebar';
import { ShellContent } from './ShellContent';
import { ShellFooter } from './ShellFooter';
type ShellBaseProps = Pick<BoxProps, "sx">;
export interface ShellProps extends ShellBaseProps {
    /**
     * Header slot - typically a Shell.Header component
     */
    header?: React.ReactNode;
    /**
     * Sidebar slot - typically a Shell.Sidebar component
     */
    sidebar?: React.ReactNode;
    /**
     * Content slot - typically a Shell.Content component
     */
    content?: React.ReactNode;
    /**
     * Footer slot - typically a Shell.Footer component
     */
    footer?: React.ReactNode;
    /**
     * Whether the sidebar is open (expanded) or closed (collapsed).
     * @default true
     */
    sidebarOpen?: boolean;
    /**
     * Width of the sidebar when expanded (in pixels).
     * @default 236
     */
    sidebarExpandedWidth?: number;
    /**
     * Width of the sidebar when collapsed (in pixels).
     * @default 88
     */
    sidebarCollapsedWidth?: number;
    /**
     * Breakpoint at which the sidebar should be hidden.
     * When specified, the sidebar will be hidden on screens smaller than this breakpoint.
     * This allows consumers to implement their own mobile navigation (e.g., drawer, bottom nav).
     *
     * Common pattern: Set to 'md' to hide sidebar on mobile/tablet, showing it only on desktop.
     *
     * @default undefined (sidebar always rendered)
     * @example
     * // Hide sidebar on mobile, consumer implements mobile menu
     * <Shell hideSidebarBelow="md">
     *   <Shell.Header leftContent={isMobile ? <HamburgerButton /> : <SidebarToggle />} />
     *   <Shell.Sidebar>...</Shell.Sidebar>
     * </Shell>
     */
    hideSidebarBelow?: Breakpoint;
}
interface ShellComposition {
    Header: typeof ShellHeader;
    Sidebar: typeof ShellSidebar;
    Content: typeof ShellContent;
    Footer: typeof ShellFooter;
}
/**
 * Root shell layout container using slots-based API.
 * Provides the base structure for application layouts with flexible composition.
 *
 * For mobile navigation, use the `hideSidebarBelow` prop to hide the sidebar on smaller screens,
 * then implement your own mobile menu solution (e.g., MUI Drawer, BottomNavigation).
 */
export declare const Shell: React.FC<ShellProps> & ShellComposition;
export {};
//# sourceMappingURL=Shell.d.ts.map