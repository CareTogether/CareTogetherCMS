import { TypographyProps } from '@mui/material';
type ExpandableTextBaseProps = Pick<TypographyProps, "sx" | "className" | "variant" | "color">;
export interface ExpandableTextProps extends ExpandableTextBaseProps {
    /**
     * The text content to display
     */
    text: string;
    /**
     * Maximum string length before truncation
     * @default 150
     */
    length?: number;
    /**
     * The string to indicate text is omitted
     * @default "..."
     */
    omission?: string;
    /**
     * The separator pattern to truncate to (string or RegExp)
     */
    separator?: string | RegExp;
    /**
     * Text for expand button
     * @default "More"
     */
    expandText?: string;
    /**
     * Text for collapse button
     * @default "Less"
     */
    collapseText?: string;
}
/**
 * ExpandableText component that truncates text based on character length
 * with an inline expand/collapse button. Only shows the button if text is truncated.
 *
 * Includes proper ARIA attributes for accessibility.
 */
export declare const ExpandableText: ({ text, length, omission, separator, expandText, collapseText, variant, color, sx, className, }: ExpandableTextProps) => import("react/jsx-runtime").JSX.Element | null;
export {};
//# sourceMappingURL=ExpandableText.d.ts.map