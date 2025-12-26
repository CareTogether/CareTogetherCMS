import { Box, BoxProps } from "@mui/material";
import { ShellHeader } from "./ShellHeader";
import { ShellSidebar } from "./ShellSidebar";
import { ShellContent } from "./ShellContent";
import { ShellFooter } from "./ShellFooter";

type ShellBaseProps = Pick<BoxProps, "sx">;

export interface ShellProps extends ShellBaseProps {
  /**
   * Shell layout children (typically Shell.Header, Shell.Sidebar, Shell.Content, Shell.Footer)
   */
  children: React.ReactNode;
}

interface ShellComposition {
  Header: typeof ShellHeader;
  Sidebar: typeof ShellSidebar;
  Content: typeof ShellContent;
  Footer: typeof ShellFooter;
}

/**
 * Root shell layout container using compound component pattern.
 * Provides the base structure for application layouts with flexible composition.
 * 
 * @component
 * @example
 * <Shell>
 *   <Shell.Header 
 *     leftContent={<MenuButton />}
 *     centerContent={<Title />}
 *     rightContent={<UserMenu />}
 *   />
 *   <Shell.Sidebar open={drawerOpen}>
 *     <NavigationItems />
 *   </Shell.Sidebar>
 *   <Shell.Content>
 *     {children}
 *   </Shell.Content>
 *   <Shell.Footer>
 *     <Copyright />
 *   </Shell.Footer>
 * </Shell>
 */
export const Shell: React.FC<ShellProps> & ShellComposition = ({ 
  children, 
  sx 
}) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        ...sx 
      }}
    >
      {children}
    </Box>
  );
};

// Attach compound components
Shell.Header = ShellHeader;
Shell.Sidebar = ShellSidebar;
Shell.Content = ShellContent;
Shell.Footer = ShellFooter;
