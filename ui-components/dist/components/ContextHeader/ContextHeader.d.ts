import { BoxProps, BreadcrumbsProps, TypographyProps, TabsProps, Breakpoint } from '@mui/material';
import { ReactNode } from 'react';
type ContextHeaderBaseProps = Pick<BoxProps, "sx" | "className">;
export interface BreadcrumbItem {
    label: string;
    href?: string;
    onClick?: () => void;
}
export interface ContextHeaderProps extends ContextHeaderBaseProps {
    /**
     * Content of the header (use compound components)
     */
    children: ReactNode;
    /**
     * Max width for the container. Set to false to disable container wrapping.
     * @default "lg"
     */
    maxWidth?: Breakpoint | false;
    /**
     * If true, removes horizontal padding from the container.
     * @default false
     */
    disableGutters?: boolean;
}
/**
 * Context-aware header for page-specific information.
 * Use compound components to compose the header layout.
 */
export declare const ContextHeader: {
    ({ children, sx, className, maxWidth, disableGutters, }: ContextHeaderProps): import("react/jsx-runtime").JSX.Element;
    Breadcrumbs: ({ items, rightContent, sx, className, }: ContextHeaderBreadcrumbsProps) => import("react/jsx-runtime").JSX.Element;
    Title: ({ title, dropdownItems, chip, actions, sx, className, component, variant, }: ContextHeaderTitleProps) => import("react/jsx-runtime").JSX.Element;
    Content: ({ children, sx, className }: ContextHeaderContentProps) => import("react/jsx-runtime").JSX.Element;
    Tabs: ({ children, rightContent, value, onChange, sx, className, }: ContextHeaderTabsProps) => import("react/jsx-runtime").JSX.Element;
};
type ContextHeaderBreadcrumbsBaseProps = Pick<BreadcrumbsProps, "sx" | "className">;
export interface ContextHeaderBreadcrumbsProps extends ContextHeaderBreadcrumbsBaseProps {
    /**
     * Breadcrumb navigation items
     */
    items: BreadcrumbItem[];
    /**
     * Optional content to display on the right side (e.g., chip, button)
     */
    rightContent?: ReactNode;
}
type ContextHeaderTitleBaseProps = Pick<TypographyProps, "sx" | "className" | "component" | "variant">;
export interface DropdownItem {
    label: string;
    onClick: () => void;
}
export interface ContextHeaderTitleProps extends ContextHeaderTitleBaseProps {
    /**
     * Page title text
     */
    title: string;
    /**
     * Optional dropdown menu items. When provided, the title becomes a button
     * with proper accessibility attributes and an automatic dropdown icon.
     */
    dropdownItems?: DropdownItem[];
    /**
     * Optional chip to display next to title (e.g., status)
     */
    chip?: ReactNode;
    /**
     * Optional action buttons on the right
     */
    actions?: ReactNode;
}
type ContextHeaderContentBaseProps = Pick<BoxProps, "sx" | "className">;
export interface ContextHeaderContentProps extends ContextHeaderContentBaseProps {
    /**
     * Content to display (paragraph text, metadata, etc.)
     */
    children: ReactNode;
}
type ContextHeaderTabsBaseProps = Pick<TabsProps, "sx" | "className" | "value" | "onChange">;
export interface ContextHeaderTabsProps extends ContextHeaderTabsBaseProps {
    /**
     * Tab components (MUI Tab elements)
     */
    children: ReactNode;
    /**
     * Optional content to display on the right (e.g., "Created Feb 21, 2025")
     */
    rightContent?: ReactNode;
}
export {};
//# sourceMappingURL=ContextHeader.d.ts.map