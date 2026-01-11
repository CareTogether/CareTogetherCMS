import "@mui/material/styles";

/**
 * Extend MUI theme to include custom color variants for CareTogether.
 *
 * This adds:
 * - primaryDark: Uses the primary.dark color (#07666C) as a distinct color option
 * - tertiary: Secondary brand color (#00616F) for hover states and accents
 *
 * Usage:
 * ```tsx
 * <Button color="primaryDark">Click me</Button>
 * <Button color="tertiary">Action</Button>
 * <Chip color="primaryDark">Status</Chip>
 * ```
 */

declare module "@mui/material/styles" {
  interface Palette {
    primaryDark: Palette["primary"];
    tertiary: Palette["primary"];
  }

  interface PaletteOptions {
    primaryDark?: PaletteOptions["primary"];
    tertiary?: PaletteOptions["primary"];
  }
}

// Update component color prop options
declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    primaryDark: true;
    tertiary: true;
  }
}

declare module "@mui/material/IconButton" {
  interface IconButtonPropsColorOverrides {
    primaryDark: true;
    tertiary: true;
  }
}

declare module "@mui/material/Chip" {
  interface ChipPropsColorOverrides {
    primaryDark: true;
    tertiary: true;
  }
}

declare module "@mui/material/Badge" {
  interface BadgePropsColorOverrides {
    primaryDark: true;
    tertiary: true;
  }
}

// This export statement makes the file a module (required for TypeScript)
export {};
