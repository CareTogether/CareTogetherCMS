// Theme
export { theme } from "./theme/theme.ts";

// Shell Components
export { Header, Sidebar, Footer } from "./components/index.ts";
export type { HeaderProps, SidebarProps, FooterProps } from "./components/index.ts";

// Context Components
export { ContextHeader } from "./components/index.ts";
export type { ContextHeaderProps, BreadcrumbItem } from "./components/index.ts";

// Chips
export { StatusChip } from "./components/index.ts";
export type { StatusChipProps, StatusType } from "./components/index.ts";

// MUI Components
export { Alert, Button } from "./components/index.ts";
export type { AlertProps, ButtonProps } from "./components/index.ts";

// Navigation Components
export { IntakeStepNav, LabelAccordion, Steps } from "./components/index.ts";
export type {
  IntakeStepNavProps,
  LabelAccordionProps,
  StepsProps,
  StepItem,
} from "./components/index.ts";

// Common Types
export type { Size, Color, Variant } from "./types/common.ts";

// Utilities
export { classNames } from "./utils/index.ts";
