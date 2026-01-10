// Shell components (compound component pattern)
export { Shell } from "./Shell";
export type {
  ShellProps,
  ShellHeaderProps,
  ShellSidebarProps,
  ShellContentProps,
  ShellFooterProps,
  ShellContextValue,
} from "./Shell";
export { useShellContext } from "./Shell";

export { ContextHeader } from "./ContextHeader";
export type {
  ContextHeaderProps,
  BreadcrumbItem,
  ContextHeaderBreadcrumbsProps,
  ContextHeaderTitleProps,
  ContextHeaderContentProps,
  ContextHeaderTabsProps,
  DropdownItem,
} from "./ContextHeader";

export { ColoredChip } from "./Chips";
export type { ColoredChipProps } from "./Chips";

export { StepNav } from "./StepNav";
export type { StepNavProps, StepItem, StepGroup } from "./StepNav";

export { Steps } from "./StepNav";
export type { StepsProps } from "./StepNav";

export { NavItem } from "./NavItem";
export type { NavItemProps } from "./NavItem";

export { ProgressCard } from "./ProgressCard";
export type { ProgressCardProps, ProgressCardStep } from "./ProgressCard";

export {
  ActivityIcon,
  ActivityItem,
  ScheduleItem,
  RecentActivity,
  TimelineCard,
  TimelineItem,
} from "./Activities";
export type {
  ActivityIconProps,
  ActivityItemProps,
  ScheduleItemProps,
  RecentActivityProps,
  RecentActivityHeaderProps,
  RecentActivityGroupProps,
  TimelineCardProps,
  TimelineItemProps,
  TimelineItemData,
} from "./Activities";
