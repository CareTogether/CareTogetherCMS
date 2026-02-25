export interface UseShellStateReturn {
    /** Whether the sidebar is currently open */
    sidebarOpen: boolean;
    /** Toggle the sidebar open/closed */
    toggleSidebar: () => void;
    /** Open the sidebar */
    openSidebar: () => void;
    /** Close the sidebar */
    closeSidebar: () => void;
}
/**
 * Hook for managing shell layout state (sidebar open/close).
 * This is an optional convenience hook - consumers can use their own state management.
 *
 * @param initialOpen - Initial open state for the sidebar (default: true)
 * @returns Object with sidebar state and control functions
 *
 * @example
 * const { sidebarOpen, toggleSidebar } = useShellState(true);
 *
 * <Shell>
 *   <Shell.Header
 *     leftContent={
 *       <IconButton onClick={toggleSidebar}>
 *         <MenuIcon />
 *       </IconButton>
 *     }
 *   />
 *   <Shell.Sidebar open={sidebarOpen} />
 * </Shell>
 */
export declare function useShellState(initialOpen?: boolean): UseShellStateReturn;
//# sourceMappingURL=useShellState.d.ts.map