// Theme
export { theme } from "./theme/theme";

// Shell Components (Compound Component Pattern)
export { Shell, useShellContext } from "./components/index";
export type {
  ShellProps,
  ShellHeaderProps,
  ShellSidebarProps,
  ShellContentProps,
  ShellFooterProps,
  ShellContextValue,
} from "./components/index";

// Context Components
export { ContextHeader } from "./components/index";
export type {
  ContextHeaderProps,
  BreadcrumbItem,
  ContextHeaderBreadcrumbsProps,
  ContextHeaderTitleProps,
  ContextHeaderContentProps,
  ContextHeaderTabsProps,
  DropdownItem,
} from "./components/index";

// Chips
export { ColoredChip } from "./components/index";
export type { ColoredChipProps } from "./components/index";

// Navigation Components
export { NavItem, StepNav, Steps, Dropdown, useDropdown } from "./components/index";
export type {
  NavItemProps,
  StepNavProps,
  StepsProps,
  StepItem,
  StepGroup,
  DropdownProps,
  DropdownMenuProps,
  DropdownButtonProps,
  DropdownIconButtonProps,
  DropdownContextType,
} from "./components/index";

// Progress Components
export { ProgressCard } from "./components/index";
export type { ProgressCardProps, ProgressCardStep } from "./components/index";

// Display Components
export { AccessiblePopover } from "./components/index";
export type { AccessiblePopoverProps } from "./components/index";

// Activity Components
export {
  ActivityIcon,
  ActivityItem,
  ScheduleItem,
  RecentActivity,
  TimelineCard,
  TimelineItem,
} from "./components/index";
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
} from "./components/index";

// Common Types
export type { Size, Color, Variant } from "./types/common";

// Utilities
export { classNames, useShellState, resolveThemeColor } from "./utils/index";
export type { UseShellStateReturn, ThemeColor } from "./utils/index";
