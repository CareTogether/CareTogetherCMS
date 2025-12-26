// Shell components (compound component pattern)
export { Shell } from "./Shell/index";
export type { 
  ShellProps,
  ShellHeaderProps,
  ShellSidebarProps,
  ShellContentProps,
  ShellFooterProps,
} from "./Shell/index.ts";

export { ContextHeader } from "./ContextHeader/index";
export type { ContextHeaderProps, BreadcrumbItem } from "./ContextHeader/index.ts";

export { StatusChip } from "./Chips/index";
export type { StatusChipProps, StatusType } from "./Chips/index.ts";

export { IntakeStepNav } from "./IntakeStepNav/index";
export type { IntakeStepNavProps } from "./IntakeStepNav/index";

export { LabelAccordion } from "./IntakeStepNav/index";
export type { LabelAccordionProps } from "./IntakeStepNav/index";

export { Steps } from "./IntakeStepNav/index";
export type { StepsProps, StepItem } from "./IntakeStepNav/index";
