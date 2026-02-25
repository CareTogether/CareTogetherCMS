import { BoxProps } from '@mui/material';
import { ReactNode } from 'react';
type ActivityIconBaseProps = Pick<BoxProps, "sx" | "className">;
export interface ActivityIconProps extends ActivityIconBaseProps {
    /**
     * Icon element to display (defaults to Diversity2Icon)
     */
    icon?: ReactNode;
    /**
     * Background color for the icon container.
     * Can be a hex color string (e.g., "#FDD835") or any valid CSS color.
     */
    color: string;
    /**
     * Size of the icon container in pixels
     * @default 44
     */
    size?: number;
}
/**
 * Activity icon component displaying an icon with a colored circular background.
 * Defaults to MUI Diversity2 icon if no icon is provided.
 */
export declare const ActivityIcon: ({ icon, color, size, sx, className }: ActivityIconProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ActivityIcon.d.ts.map