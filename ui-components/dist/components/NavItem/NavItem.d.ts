import { BoxProps } from '@mui/material';
import { ElementType, ReactNode } from 'react';
type NavItemBaseProps = Pick<BoxProps, "sx" | "className" | "component">;
export interface NavItemProps extends NavItemBaseProps {
    /**
     * Icon element to display
     */
    icon: ReactNode;
    /**
     * Text label for the navigation item
     */
    text: string;
    /**
     * Whether the nav item is in collapsed state (text hidden, tooltip shown)
     */
    collapsed?: boolean;
    /**
     * Optional click handler
     */
    onClick?: () => void;
    /**
     * The component used for the root node (default: "button")
     * Can be a string for HTML elements or a React component (e.g., Link from react-router)
     */
    component?: ElementType;
    /**
     * Accessible label for screen readers (defaults to text prop)
     */
    "aria-label"?: string;
}
/**
 * Navigation item component with icon and text
 */
export declare const NavItem: ({ icon, text, collapsed, onClick, component, sx, className, ...rest }: NavItemProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=NavItem.d.ts.map