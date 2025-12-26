/**
 * Utility functions for the component library
 */

/**
 * Combines multiple class names into a single string
 */
export const classNames = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(" ");
};

export { useShellState } from "./useShellState.ts";
export type { UseShellStateReturn } from "./useShellState.ts";
