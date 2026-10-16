import { Drawer } from '@mui/material';
import { ReactNode, useState, useSyncExternalStore } from 'react';

// The panel component is created once per hook instance so its identity stays stable
// across renders. A component defined inline would be a new type on every render and
// React would remount the panel content, discarding any state it holds (drafts, saving).
function createSidePanel() {
  let open = false;
  const listeners = new Set<() => void>();

  const setOpen = (next: boolean) => {
    if (open === next) return;
    open = next;
    listeners.forEach((listener) => listener());
  };
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  const getOpen = () => open;

  const openSidePanel = () => setOpen(true);
  const closeSidePanel = () => setOpen(false);

  function SidePanel({ children }: { children: ReactNode }) {
    const isOpen = useSyncExternalStore(subscribe, getOpen);

    return (
      <Drawer
        // For some reason, without this, the text field in AddRole will not be autofocused
        disableRestoreFocus
        anchor="right"
        open={isOpen}
        onClose={closeSidePanel}
        slotProps={{
          paper: {
            sx: {
              padding: 2,
              paddingTop: { xs: 7, sm: 8, md: 6 },
            },
          },
        }}
      >
        {children}
      </Drawer>
    );
  }

  return { SidePanel, openSidePanel, closeSidePanel };
}

export function useSidePanel() {
  const [sidePanel] = useState(createSidePanel);
  return sidePanel;
}
