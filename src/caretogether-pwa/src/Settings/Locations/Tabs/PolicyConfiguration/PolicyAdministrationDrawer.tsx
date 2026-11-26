import { Box, Drawer, IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  usePolicyTransitionGuard,
  useUnsavedPolicyNavigation,
} from '../../../../Hooks/useUnsavedPolicyNavigation';
import {
  AdministrationContext,
  type FormState,
} from './usePolicyAdministrationPanels';
export function PolicyAdministrationDrawer({
  children,
  open,
  direct = false,
  onClose,
}: {
  children: ReactNode;
  open: boolean;
  direct?: boolean;
  onClose: () => void;
}) {
  const [active, setActive] = useState<string | null>(null);
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const [form, setForm] = useState<FormState>({ dirty: false, saving: false });
  const returnFocus = useRef<HTMLElement | null>(null);
  const canLeave = usePolicyTransitionGuard();
  const canCloseForm = usePolicyTransitionGuard(form);
  useUnsavedPolicyNavigation(
    active !== null && form.dirty,
    active !== null && form.saving
  );
  const setFormState = useCallback(
    (value: FormState) =>
      setForm((current) =>
        current.dirty === value.dirty && current.saving === value.saving
          ? current
          : value
      ),
    []
  );
  const openPanel = useCallback((id: string) => {
    returnFocus.current = document.activeElement as HTMLElement;
    setForm({ dirty: false, saving: false });
    setActive(id);
  }, []);
  function closePanel() {
    setActive(null);
    setForm({ dirty: false, saving: false });
    if (direct) onClose();
  }
  async function requestClose() {
    if (active !== null) {
      if (await canCloseForm()) closePanel();
    } else if (await canLeave()) onClose();
  }
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (active !== null)
        target
          ?.querySelector<HTMLElement>(
            'input:not([type="hidden"]):not([disabled]), button:not([disabled]), [tabindex="0"]'
          )
          ?.focus();
      else if (returnFocus.current?.isConnected) returnFocus.current.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [active, target]);
  const content = (
    <Box hidden={active !== null || direct} sx={{ minWidth: 0 }}>
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          component="h2"
          sx={{ minWidth: 0 }}
          className="ph-unmask"
        >
          Manage Arrangements &amp; Functions
        </Typography>
        <IconButton aria-label="Close administration" onClick={requestClose}>
          <CloseIcon />
        </IconButton>
      </Stack>
      {children}
    </Box>
  );
  return (
    <AdministrationContext.Provider
      value={{
        active,
        target,
        open: openPanel,
        close: closePanel,
        requestClose,
        setFormState,
      }}
    >
      <Drawer
        anchor="right"
        open={open}
        onClose={requestClose}
        slotProps={{
          paper: {
            role: 'dialog',
            'aria-modal': true,
            'aria-label': 'Manage Arrangements & Functions',
            sx: {
              width: { xs: '100vw', sm: active !== null ? 600 : 1100 },
              maxWidth: '100vw',
              boxSizing: 'border-box',
              p: 2,
              overflowX: 'hidden',
            },
          },
        }}
      >
        {content}
        <Box ref={setTarget} sx={{ minWidth: 0 }} />
      </Drawer>
    </AdministrationContext.Provider>
  );
}
