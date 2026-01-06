import { Theme } from "@mui/material";

/**
 * Theme color keys that can be resolved
 */
export type ThemeColor = "primary" | "secondary" | "success" | "info" | "warning" | "error";

/**
 * Resolves a theme color key or custom color string to an actual color value.
 *
 * @param color - Theme color key (e.g., "primary", "success") or custom hex/rgb color
 * @param theme - MUI theme object
 * @returns Resolved color value
 *
 * @example
 * const color = resolveThemeColor("primary", theme);
 * // Returns theme.palette.primary.main
 *
 * @example
 * const color = resolveThemeColor("#9C27B0", theme);
 * // Returns "#9C27B0"
 */
export const resolveThemeColor = (color: string, theme: Theme): string => {
  switch (color) {
    case "primary":
      return theme.palette.primary.main;
    case "secondary":
      return theme.palette.secondary.main;
    case "success":
      return theme.palette.success.main;
    case "info":
      return theme.palette.info.main;
    case "warning":
      return theme.palette.warning.main;
    case "error":
      return theme.palette.error.main;
    default:
      return color; // Assume it's a custom color string (hex, rgb, etc.)
  }
};
