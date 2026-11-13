import { Box } from '@mui/material';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useSidePanel } from '../../../../Hooks/useSidePanel';
export type FormState = { dirty: boolean; saving: boolean };
export const AdministrationContext = createContext<
  | {
      active: string | null;
      target: HTMLDivElement | null;
      open: (id: string) => void;
      close: () => void;
      requestClose: () => void;
      setFormState: (value: FormState) => void;
    }
  | undefined
>(undefined);

export function useAdministrationSidePanel(
  options: Parameters<typeof useSidePanel>[0] = {}
) {
  const scope = useContext(AdministrationContext);
  const fallback = useSidePanel(options);
  const id = useId();
  const open = scope?.open;
  const openSidePanel = useCallback(() => open?.(id), [open, id]);
  const SidePanel = useMemo(
    () =>
      function AdministrationPanel({ children }: { children: ReactNode }) {
        const context = useContext(AdministrationContext);
        if (!context?.target || context.active !== id) return null;
        return createPortal(
          <Box className={options.className}>{children}</Box>,
          context.target
        );
      },
    [id, options.className]
  );
  return scope
    ? {
        SidePanel,
        openSidePanel,
        closeSidePanel: scope.close,
        requestCloseSidePanel: scope.requestClose,
        coordinated: true,
      }
    : {
        ...fallback,
        requestCloseSidePanel: fallback.closeSidePanel,
        coordinated: false,
      };
}

export function useAdministrationFormState(draft: unknown, saving: boolean) {
  const context = useContext(AdministrationContext);
  const value = JSON.stringify(draft);
  const original = useRef(value);
  const setFormState = context?.setFormState;
  useEffect(() => {
    setFormState?.({ dirty: original.current !== value, saving });
  }, [setFormState, value, saving]);
}
