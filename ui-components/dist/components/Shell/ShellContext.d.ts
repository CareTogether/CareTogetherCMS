/**
 * Context for sharing Shell layout dimensions between Shell and its children.
 */
export interface ShellContextValue {
    /**
     * Height of the header in pixels
     * @default 64
     */
    headerHeight: number;
    /**
     * Current width of the sidebar in pixels (based on open/collapsed state)
     */
    sidebarWidth: number;
    /**
     * Whether the sidebar is open (expanded) or closed (collapsed)
     * Only present when inside a Shell component
     */
    sidebarOpen?: boolean;
    /**
     * Width of the sidebar when expanded (in pixels)
     * Only present when inside a Shell component
     */
    sidebarExpandedWidth?: number;
    /**
     * Width of the sidebar when collapsed (in pixels)
     * Only present when inside a Shell component
     */
    sidebarCollapsedWidth?: number;
}
export declare const ShellContext: import('react').Context<ShellContextValue | null>;
/**
 * Hook to access Shell context values.
 * Returns null when not used within a Shell component (e.g., standalone usage).
 * @returns Shell context with layout values, or null if not in Shell
 */
export declare const useShellContext: () => ShellContextValue | null;
//# sourceMappingURL=ShellContext.d.ts.map