import { BoxProps } from '@mui/material';
import { ReactNode } from 'react';
type RecentActivityBaseProps = Pick<BoxProps, "sx" | "className">;
export interface RecentActivityProps extends RecentActivityBaseProps {
    /**
     * Content of the recent activity card (use compound components)
     */
    children: ReactNode;
}
interface RecentActivityComposition {
    Header: typeof RecentActivityHeader;
    Group: typeof RecentActivityGroup;
}
/**
 * Recent activity card container using compound component pattern.
 */
export declare const RecentActivity: React.FC<RecentActivityProps> & RecentActivityComposition;
type RecentActivityHeaderBaseProps = Pick<BoxProps, "sx" | "className">;
export interface RecentActivityHeaderProps extends RecentActivityHeaderBaseProps {
    /**
     * Header text content
     */
    children: ReactNode;
    /**
     * Optional action element to display on the right (e.g., link, button)
     */
    action?: ReactNode;
}
declare const RecentActivityHeader: ({ children, action, sx, className }: RecentActivityHeaderProps) => import("react/jsx-runtime").JSX.Element;
type RecentActivityGroupBaseProps = Pick<BoxProps, "sx" | "className">;
export interface RecentActivityGroupProps extends RecentActivityGroupBaseProps {
    /**
     * Group title/header text (e.g., "Today", "Yesterday")
     * Optional - if not provided, no title will be displayed
     */
    title?: string;
    /**
     * Activity items to display in this group
     * Typically a collection of ActivityItem components
     */
    children: ReactNode;
}
/**
 * Group sub-component for organizing activity items by time period or category.
 * Automatically adds spacing between groups and displays an optional title.
 */
declare const RecentActivityGroup: ({ title, children, sx, className }: RecentActivityGroupProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=RecentActivity.d.ts.map