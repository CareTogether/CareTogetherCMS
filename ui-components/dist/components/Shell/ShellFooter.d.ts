import { CardProps } from '@mui/material';
type ShellFooterBaseProps = Pick<CardProps, "sx" | "component">;
export interface ShellFooterProps extends ShellFooterBaseProps {
    /**
     * Footer content
     */
    children?: React.ReactNode;
}
/**
 * Shell footer component providing a flexible footer layout.
 * Use as part of the Shell compound component pattern.
 */
export declare const ShellFooter: ({ children, component, sx }: ShellFooterProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ShellFooter.d.ts.map