// Shell components (compound component pattern)
export { Shell } from "./Shell/index.ts";
export type { 
  ShellProps,
  ShellHeaderProps,
  ShellSidebarProps,
  ShellContentProps,
  ShellFooterProps,
} from "./Shell/index.ts";

export { ContextHeader } from "./ContextHeader/index.ts";
export type { ContextHeaderProps, BreadcrumbItem } from "./ContextHeader/index.ts";

export { StatusChip } from "./Chips/index.ts";
export type { StatusChipProps, StatusType } from "./Chips/index.ts";

export { IntakeStepNav } from "./IntakeStepNav/index.ts";
export type { IntakeStepNavProps, StepItem, StepGroup } from "./IntakeStepNav/index.ts";

export { LabelAccordion } from "./IntakeStepNav/index.ts";
export type { LabelAccordionProps } from "./IntakeStepNav/index.ts";

export { Steps } from "./IntakeStepNav/index.ts";
export type { StepsProps } from "./IntakeStepNav/index.ts";

export { NavItem } from "./NavItem/index.ts";
export type { NavItemProps } from "./NavItem/index.ts";
