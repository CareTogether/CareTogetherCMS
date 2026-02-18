import { BoxProps } from '@mui/material';
import { ReactNode } from 'react';
type TimelineItemBaseProps = Pick<BoxProps, "sx" | "className">;
export interface TimelineItemProps extends TimelineItemBaseProps {
    /**
     * Timestamp text displayed on the left
     */
    timestamp: string;
    /**
     * Icon element to display in the timeline
     */
    icon: ReactNode;
    /**
     * Name/title text (primary text on the right)
     */
    name: string;
    /**
     * Description/subtitle text (secondary text below name)
     */
    description: string;
    /**
     * Whether this is the last item in the timeline (affects connector line)
     * @default false
     */
    isLast?: boolean;
    /**
     * Width of the timestamp column
     * @default "140px"
     */
    timestampWidth?: string | number;
}
/**
 * Timeline item component displaying a timestamp, vertical connector with icon,
 * and content (name + description). Designed for use within TimelineCard.
 */
export declare const TimelineItem: ({ timestamp, icon, name, description, isLast, timestampWidth, sx, className, }: TimelineItemProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=TimelineItem.d.ts.map