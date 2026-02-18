import { ChipProps } from '@mui/material';
import { ReactElement } from 'react';
type ColoredChipBaseProps = Pick<ChipProps, "variant" | "sx" | "className">;
export interface ColoredChipProps extends ColoredChipBaseProps {
    /**
     * The chip label text
     */
    label: string;
    /**
     * Optional icon element to display before the label
     */
    startIcon?: ReactElement;
    /**
     * Icon color - can be a theme color key or custom hex color
     * @default "grey.900"
     */
    color?: "success" | "info" | "warning" | "error" | "primary" | "secondary" | string;
    /**
     * Size of the chip
     * @default "medium"
     */
    size?: "small" | "medium";
}
/**
 * Generic chip component with optional colored icon and lightened background.
 */
export declare const ColoredChip: ({ label, startIcon, color, size, sx, ...rest }: ColoredChipProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ColoredChip.d.ts.map