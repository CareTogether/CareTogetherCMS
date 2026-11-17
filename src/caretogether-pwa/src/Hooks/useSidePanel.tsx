import { Drawer } from '@mui/material';
import {
  createContext,
  ReactNode,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useUnsavedPolicyNavigation } from './useUnsavedPolicyNavigation';
export const SidePanelSavingContext = createContext<
  ((saving: boolean) => void) | undefined
>(undefined);

// The panel component is created once per hook instance so its identity stays stable
// across renders. A component defined inline would be a new type on every render and
// React would remount the panel content, discarding any state it holds (drafts, saving).
function createSidePanel(
  className?: string,
  protectNavigation = false,
  beforeClose?: () => Promise<boolean>
) {
  function SidePanelNavigationGuard() {
    useUnsavedPolicyNavigation(true);
    return null;
  }
  let open = false;
  let saving = false;
  const setSaving = (value: boolean) => {
    saving = value;
  };
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
  const requestCloseSidePanel = async () => {
    if (saving) return;
    if (!beforeClose || (await beforeClose())) closeSidePanel();
  };

  function SidePanel({ children }: { children: ReactNode }) {
    const isOpen = useSyncExternalStore(subscribe, getOpen);

    return (
      <>
        {protectNavigation && isOpen && <SidePanelNavigationGuard />}
        <Drawer
          // The drawer renders in a portal, outside the page's own ph-unmask scope.
          className={className}
          // For some reason, without this, the text field in AddRole will not be autofocused
          disableRestoreFocus
          anchor="right"
          open={isOpen}
          onClose={requestCloseSidePanel}
          slotProps={{
            paper: {
              sx: {
                padding: 2,
                paddingTop: { xs: 7, sm: 8, md: 6 },
              },
            },
          }}
        >
          <SidePanelSavingContext.Provider value={setSaving}>
            {children}
          </SidePanelSavingContext.Provider>
        </Drawer>
      </>
    );
  }

  return { SidePanel, openSidePanel, closeSidePanel, requestCloseSidePanel };
}

export function useSidePanel({
  className,
  protectNavigation,
  onBeforeClose,
}: {
  className?: string;
  protectNavigation?: boolean;
  onBeforeClose?: () => Promise<boolean>;
} = {}) {
  const beforeClose = useRef(onBeforeClose);
  beforeClose.current = onBeforeClose;
  const [sidePanel] = useState(() =>
    createSidePanel(
      className,
      protectNavigation,
      () => beforeClose.current?.() ?? Promise.resolve(true)
    )
  );
  return sidePanel;
}
