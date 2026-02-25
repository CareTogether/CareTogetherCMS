import { CardProps } from '@mui/material';
import { ReactNode } from 'react';
type TimelineCardBaseProps = Pick<CardProps, "sx" | "className" | "variant" | "elevation">;
export interface TimelineItemData {
    /**
     * Timestamp for the timeline entry
     */
    timestamp: string;
    /**
     * Icon element to display in the timeline
     */
    icon: ReactNode;
    /**
     * Name/title for the timeline entry
     */
    name: string;
    /**
     * Description/subtitle for the timeline entry
     */
    description: string;
}
export interface TimelineCardProps extends TimelineCardBaseProps {
    /**
     * Optional header title text
     */
    title?: string;
    /**
     * Optional sub-header text displayed below the title
     */
    subHeader?: string;
    /**
     * Optional action element(s) to display in the header (e.g., buttons, links)
     */
    actions?: ReactNode;
    /**
     * Array of timeline items to display
     */
    items: TimelineItemData[];
    /**
     * Message to display when items array is empty
     * @default "No timeline entries"
     */
    emptyMessage?: string;
    /**
     * Accessible label for the timeline list
     * @default "Timeline"
     */
    timelineAriaLabel?: string;
}
/**
 * Timeline card component displaying a vertical timeline of events with optional
 * header, sub-header, and action buttons.
 */
export declare const TimelineCard: ({ title, subHeader, actions, items, emptyMessage, timelineAriaLabel, sx, className, variant, elevation, }: TimelineCardProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=TimelineCard.d.ts.map