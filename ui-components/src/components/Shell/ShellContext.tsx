import { createContext, useContext } from "react";

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
}

const defaultContextValue: ShellContextValue = {
  headerHeight: 64,
  sidebarWidth: 236,
};

export const ShellContext = createContext<ShellContextValue>(defaultContextValue);

/**
 * Hook to access Shell context values
 * @returns Shell context with headerHeight and sidebarWidth
 */
export const useShellContext = () => {
  const context = useContext(ShellContext);
  if (!context) {
    throw new Error("useShellContext must be used within a Shell component");
  }
  return context;
};
