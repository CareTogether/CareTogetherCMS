import { BoxProps } from '@mui/material';
type ShellContentBaseProps = Pick<BoxProps, "sx" | "component">;
export interface ShellContentProps extends ShellContentBaseProps {
    /**
     * Main application content
     */
    children: React.ReactNode;
    /**
     * Left margin to account for sidebar width (e.g., "240px")
     */
    marginLeft?: string | number;
    /**
     * Top margin to account for header height (e.g., "64px")
     */
    marginTop?: string | number;
    /**
     * Bottom margin to account for footer height (e.g., "48px")
     */
    marginBottom?: string | number;
}
/**
 * Shell content area component providing proper spacing for the main application content.
 * Use as part of the Shell compound component pattern.
 */
export declare const ShellContent: ({ children, marginLeft, marginTop, marginBottom, component, sx, }: ShellContentProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ShellContent.d.ts.map