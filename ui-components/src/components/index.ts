// Shell components (compound component pattern)
export { Shell } from "./Shell/index";
export type {
  ShellProps,
  ShellHeaderProps,
  ShellSidebarProps,
  ShellContentProps,
  ShellFooterProps,
} from "./Shell/index";

export { ContextHeader } from "./ContextHeader/index";
export type { ContextHeaderProps, BreadcrumbItem } from "./ContextHeader/index";

export { ColoredChip } from "./Chips/index";
export type { ColoredChipProps } from "./Chips/index";

export { IntakeStepNav } from "./IntakeStepNav/index";
export type { IntakeStepNavProps, StepItem, StepGroup } from "./IntakeStepNav/index";

export { Steps } from "./IntakeStepNav/index";
export type { StepsProps } from "./IntakeStepNav/index";

export { NavItem } from "./NavItem/index";
export type { NavItemProps } from "./NavItem/index";

export { ProgressCard } from "./ProgressCard/index";
export type { ProgressCardProps, ProgressCardStep } from "./ProgressCard/index";

export { ActivityIcon, ActivityItem, ScheduleItem, RecentActivity } from "./Activities/index";
export type {
  ActivityIconProps,
  ActivityItemProps,
  ScheduleItemProps,
  RecentActivityProps,
  RecentActivityHeaderProps,
  RecentActivityGroupProps,
} from "./Activities/index";
