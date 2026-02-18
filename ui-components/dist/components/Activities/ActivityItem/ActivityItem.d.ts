import { BoxProps } from '@mui/material';
import { ReactNode } from 'react';
type ActivityItemBaseProps = Pick<BoxProps, "sx" | "className">;
export interface ActivityItemProps extends ActivityItemBaseProps {
    /**
     * Icon element to display on the left
     */
    icon: ReactNode;
    /**
     * Time text (displayed as secondary text above the title)
     */
    time: string;
    /**
     * Title/name text (primary text)
     */
    title: string;
    /**
     * Optional action element to display below the title (e.g., link, button)
     */
    action?: ReactNode;
}
/**
 * Activity item component displaying an icon, timestamp, title, and optional action.
 */
export declare const ActivityItem: ({ icon, time, title, action, sx, className }: ActivityItemProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ActivityItem.d.ts.map