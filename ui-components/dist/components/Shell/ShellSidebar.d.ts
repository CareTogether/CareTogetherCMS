import { BoxProps } from '@mui/material';
type ShellSidebarBaseProps = Pick<BoxProps, "sx">;
export interface ShellSidebarProps extends ShellSidebarBaseProps {
    /**
     * Whether the sidebar is open (expanded) or closed (collapsed).
     * When used inside Shell, automatically consumes from context.
     * @default true
     */
    open?: boolean;
    /**
     * Width of the sidebar when expanded (in pixels).
     * When used inside Shell, automatically consumes from context.
     * @default 236
     */
    expandedWidth?: number;
    /**
     * Width of the sidebar when collapsed (in pixels).
     * When used inside Shell, automatically consumes from context.
     * @default 88
     */
    collapsedWidth?: number;
    /**
     * Content to display inside the sidebar
     */
    children?: React.ReactNode;
}
/**
 * Shell sidebar component providing a persistent navigation sidebar.
 * When used inside Shell, automatically consumes open/width state from context.
 * Can also be used standalone by passing props directly.
 */
export declare const ShellSidebar: ({ open: openProp, expandedWidth: expandedWidthProp, collapsedWidth: collapsedWidthProp, children, sx, }: ShellSidebarProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ShellSidebar.d.ts.map