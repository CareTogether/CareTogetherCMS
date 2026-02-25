import { AppBarProps } from '@mui/material';
type ShellHeaderBaseProps = Pick<AppBarProps, "sx" | "color" | "elevation" | "position">;
export interface ShellHeaderProps extends ShellHeaderBaseProps {
    /**
     * Content displayed on the left side of the header (typically menu button, logo)
     */
    leftContent?: React.ReactNode;
    /**
     * Content displayed in the center of the header (typically title, breadcrumbs)
     */
    centerContent?: React.ReactNode;
    /**
     * Content displayed on the right side of the header (typically search, user menu, notifications)
     */
    rightContent?: React.ReactNode;
}
/**
 * Shell header component providing a flexible header layout with three content areas.
 * Use as part of the Shell compound component pattern.
 */
export declare const ShellHeader: ({ leftContent, centerContent, rightContent, position, elevation, color, sx, }: ShellHeaderProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ShellHeader.d.ts.map