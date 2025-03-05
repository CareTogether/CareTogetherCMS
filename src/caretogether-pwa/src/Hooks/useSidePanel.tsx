import { Drawer } from '@mui/material';
import { ReactNode, useState } from 'react';

export function useSidePanel() {
  const [open, setOpen] = useState(false);

  const openSidePanel = () => setOpen(true);
  const closeSidePanel = () => setOpen(false);

  const SidePanel = ({ children }: { children: ReactNode }) => (
    <Drawer
      // For some reason, without this, the text field in AddRole will not be autofocused
      disableRestoreFocus
      anchor="right"
      open={open}
      onClose={() => setOpen(false)}
      sx={{
        '.MuiDrawer-paper': {
          padding: 2,
          paddingTop: { xs: 7, sm: 8, md: 6 },
        },
      }}
    >
      {children}
    </Drawer>
  );

  return { SidePanel, openSidePanel, closeSidePanel };
}
