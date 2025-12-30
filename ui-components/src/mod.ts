// Theme
export { theme } from "./theme/theme";

// Shell Components (Compound Component Pattern)
export { Shell } from "./components/index";
export type {
  ShellProps,
  ShellHeaderProps,
  ShellSidebarProps,
  ShellContentProps,
  ShellFooterProps,
} from "./components/index";

// Context Components
export { ContextHeader } from "./components/index";
export type { ContextHeaderProps, BreadcrumbItem } from "./components/index";

// Chips
export { ColoredChip } from "./components/index";
export type { ColoredChipProps } from "./components/index";

// Navigation Components
export { IntakeStepNav, Steps } from "./components/index";
export type { IntakeStepNavProps, StepsProps, StepItem } from "./components/index";

// Progress Components
export { Progress } from "./components/index";
export type { ProgressProps, ProgressStep } from "./components/index";

// Common Types
export type { Size, Color, Variant } from "./types/common";

// Utilities
export { classNames, useShellState } from "./utils/index";
export type { UseShellStateReturn } from "./utils/index";
