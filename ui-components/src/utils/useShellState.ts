import { useState, useCallback } from "react";

export interface UseShellStateReturn {
  /** Whether the sidebar is currently open */
  sidebarOpen: boolean;
  /** Set the sidebar open state */
  setSidebarOpen: (open: boolean) => void;
  /** Toggle the sidebar open/closed */
  toggleSidebar: () => void;
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
export function useShellState(initialOpen = true): UseShellStateReturn {
  const [sidebarOpen, setSidebarOpen] = useState(initialOpen);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev: boolean) => !prev);
  }, []);

  return {
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
  };
}
