import { Theme } from '@mui/material';
/**
 * Theme color keys that can be resolved
 */
export type ThemeColor = "primary" | "secondary" | "success" | "info" | "warning" | "error" | "primaryDark" | "tertiary";
/**
 * Resolves a theme color key or custom color string to an actual color value.
 *
 * @param color - Theme color key (e.g., "primary", "success", "primaryDark", "tertiary") or custom hex/rgb color
 * @param theme - MUI theme object
 * @returns Resolved color value
 *
 * @example
 * const color = resolveThemeColor("primary", theme);
 * // Returns theme.palette.primary.main
 *
 * @example
 * const color = resolveThemeColor("primaryDark", theme);
 * // Returns theme.palette.primaryDark.main
 *
 * @example
 * const color = resolveThemeColor("#9C27B0", theme);
 * // Returns "#9C27B0"
 */
export declare const resolveThemeColor: (color: string, theme: Theme) => string;
//# sourceMappingURL=resolveThemeColor.d.ts.map